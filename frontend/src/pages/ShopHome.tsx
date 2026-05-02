import { useEffect, useMemo, useState } from "react";

import { apiClient } from "../api/client";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatePanel } from "../components/StatePanel";
import { Toast } from "../components/Toast";
import type { BlockPayload, SectionPayload, SessionState, SiteProfilePayload, SiteResponse } from "../data/types";
import type { Locale } from "../lib/i18n";
import { pickText, uiCopy } from "../lib/i18n";

type ShopHomeProps = {
  site: SiteResponse;
  locale: Locale;
  session: SessionState;
  searchQuery: string;
  activeSectionSlug: string | null;
  onSelectSection: (slug: string) => void;
  onGoHome: () => void;
  onOpenLogs: () => void;
  onRefresh: () => Promise<void>;
};

type SectionDraftMap = Record<number, SectionPayload>;
type BlockDraftMap = Record<number, BlockPayload>;
type NewBlockMap = Record<number, BlockPayload>;
type SiteProfileDraft = SiteProfilePayload;
type ConfirmState =
  | { type: "section"; id: number }
  | { type: "block"; id: number }
  | null;

type SearchResult = {
  key: string;
  slug: string;
  kind: "section" | "block";
  title: string;
  excerpt: string;
};

const emptySection = (): SectionPayload => ({
  slug: "",
  title: { en: "", zh: "" },
  summary: { en: "", zh: "" },
  position: undefined,
});

const emptyBlock = (): BlockPayload => ({
  title: { en: "", zh: "" },
  kind: "text",
  content: { en: "", zh: "" },
  image_url: "",
  position: undefined,
});

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function includesQuery(values: string[], query: string): boolean {
  if (!query) {
    return true;
  }
  return values.some((value) => value.toLowerCase().includes(query));
}

function nextPosition(position?: number): number {
  return (position ?? 0) + 1;
}

function getLeadImage(section: SiteResponse["sections"][number]): string {
  return section.blocks.find((block) => block.kind === "image" && block.image_url)?.image_url ?? "";
}

function scrollToElement(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function formatCount(value: number, label: string, locale: Locale): string {
  return locale === "zh" ? `${value}${label}` : `${value} ${label}`;
}

function getReadingParagraphs(value: string): string[] {
  const paragraphs = value
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.length ? paragraphs : [value.trim()].filter(Boolean);
}

export function ShopHome({
  site,
  locale,
  session,
  searchQuery,
  activeSectionSlug,
  onSelectSection,
  onGoHome,
  onOpenLogs,
  onRefresh,
}: ShopHomeProps) {
  const copy = uiCopy[locale];
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => window.localStorage.getItem("scifi-sidebar-collapsed") === "true",
  );
  const [sectionDrafts, setSectionDrafts] = useState<SectionDraftMap>({});
  const [blockDrafts, setBlockDrafts] = useState<BlockDraftMap>({});
  const [siteProfileDraft, setSiteProfileDraft] = useState<SiteProfileDraft>({
    site_title: site.site_title,
    tagline: site.tagline,
    intro: site.intro,
  });
  const [newSection, setNewSection] = useState<SectionPayload>(emptySection());
  const [newBlocks, setNewBlocks] = useState<NewBlockMap>({});
  const [uploadingTargets, setUploadingTargets] = useState<Record<string, boolean>>({});
  const [uploadProgressTargets, setUploadProgressTargets] = useState<Record<string, number>>({});
  const [uploadErrorTargets, setUploadErrorTargets] = useState<Record<string, string>>({});
  const [uploadRetryFiles, setUploadRetryFiles] = useState<Record<string, File>>({});
  const [toastMessage, setToastMessage] = useState("");
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [siteProfileEditing, setSiteProfileEditing] = useState(false);
  const canEdit = session.authenticated;
  const query = normalize(searchQuery);
  const activeSection = activeSectionSlug
    ? site.sections.find((section) => section.slug === activeSectionSlug) ?? null
    : null;

  useEffect(() => {
    window.localStorage.setItem("scifi-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const nextSections: SectionDraftMap = {};
    const nextBlocks: BlockDraftMap = {};
    const nextNewBlocks: NewBlockMap = {};

    site.sections.forEach((section) => {
      nextSections[section.id] = {
        slug: section.slug,
        title: section.title,
        summary: section.summary,
        position: section.position,
      };
      nextNewBlocks[section.id] = {
        ...emptyBlock(),
        position: nextPosition(section.blocks[section.blocks.length - 1]?.position),
      };
      section.blocks.forEach((block) => {
        nextBlocks[block.id] = {
          title: block.title,
          kind: block.kind,
          content: block.content,
          image_url: block.image_url,
          position: block.position,
        };
      });
    });

    setSectionDrafts(nextSections);
    setBlockDrafts(nextBlocks);
    setNewBlocks(nextNewBlocks);
    setSiteProfileDraft({
      site_title: site.site_title,
      tagline: site.tagline,
      intro: site.intro,
    });
    if (!canEdit) {
      setSiteProfileEditing(false);
    }
  }, [canEdit, site]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => setToastMessage(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const filteredSections = useMemo(
    () =>
      site.sections.filter((section) =>
        includesQuery(
          [
            section.slug,
            section.title.en,
            section.title.zh,
            section.summary.en,
            section.summary.zh,
            ...section.blocks.flatMap((block) => [
              block.title.en,
              block.title.zh,
              block.content.en,
              block.content.zh,
              block.image_url,
            ]),
          ],
          query,
        ),
      ),
    [query, site.sections],
  );

  const visibleBlocks = useMemo(() => {
    if (!activeSection) {
      return [];
    }

    const sectionMatches = includesQuery(
      [
        activeSection.slug,
        activeSection.title.en,
        activeSection.title.zh,
        activeSection.summary.en,
        activeSection.summary.zh,
      ],
      query,
    );

    if (!query || sectionMatches) {
      return activeSection.blocks;
    }

    return activeSection.blocks.filter((block) =>
      includesQuery([block.title.en, block.title.zh, block.content.en, block.content.zh, block.image_url], query),
    );
  }, [activeSection, query]);

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!query) {
      return [];
    }

    const results: SearchResult[] = [];

    site.sections.forEach((section) => {
      if (includesQuery([section.title.en, section.title.zh, section.summary.en, section.summary.zh, section.slug], query)) {
        results.push({
          key: `section-${section.id}`,
          slug: section.slug,
          kind: "section",
          title: pickText(section.title, locale),
          excerpt: pickText(section.summary, locale),
        });
      }

      section.blocks.forEach((block) => {
        if (includesQuery([block.title.en, block.title.zh, block.content.en, block.content.zh, block.image_url], query)) {
          results.push({
            key: `block-${block.id}`,
            slug: section.slug,
            kind: "block",
            title: pickText(block.title, locale),
            excerpt: pickText(block.content, locale),
          });
        }
      });
    });

    return results.slice(0, 8);
  }, [locale, query, site.sections]);

  const recentEntries = site.change_logs.slice(0, 4);

  const localizeMessage = (message: string) => {
    if (message === "Unable to reach the content service right now.") {
      return copy.serviceUnavailableMessage;
    }
    if (message === "Failed to read file" || message === "Failed to compress image" || message === "Failed to decode image") {
      return copy.uploadFailed;
    }
    return message;
  };

  const updateSectionDraft = (sectionId: number, patch: Partial<SectionPayload>) => {
    setSectionDrafts((current) => ({
      ...current,
      [sectionId]: { ...current[sectionId], ...patch },
    }));
  };

  const updateBlockDraft = (blockId: number, patch: Partial<BlockPayload>) => {
    setBlockDrafts((current) => ({
      ...current,
      [blockId]: { ...current[blockId], ...patch },
    }));
  };

  const updateNewBlockDraft = (sectionId: number, patch: Partial<BlockPayload>) => {
    setNewBlocks((current) => ({
      ...current,
      [sectionId]: { ...(current[sectionId] ?? emptyBlock()), ...patch },
    }));
  };

  const setUploadingState = (key: string, nextValue: boolean) => {
    setUploadingTargets((current) => {
      const next = { ...current };
      if (nextValue) {
        next[key] = true;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const setUploadProgress = (key: string, percent: number) => {
    setUploadProgressTargets((current) => ({ ...current, [key]: percent }));
  };

  const clearUploadProgress = (key: string) => {
    setUploadProgressTargets((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const setUploadError = (key: string, message: string) => {
    setUploadErrorTargets((current) => ({ ...current, [key]: message }));
  };

  const clearUploadError = (key: string) => {
    setUploadErrorTargets((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const uploadImageIntoDraft = async (file: File, key: string, applyImageUrl: (url: string) => void) => {
    setUploadingState(key, true);
    clearUploadError(key);
    setUploadProgress(key, 6);
    setUploadRetryFiles((current) => ({ ...current, [key]: file }));
    let uploadedSuccessfully = false;
    try {
      const uploaded = await apiClient.uploadImage(file, (percent) => setUploadProgress(key, percent));
      applyImageUrl(uploaded.url);
      uploadedSuccessfully = true;
      setToastMessage(copy.imageUploaded);
    } catch (error) {
      const message = error instanceof Error ? localizeMessage(error.message) : copy.uploadFailed;
      setUploadError(key, message);
      setToastMessage(message);
    } finally {
      setUploadingState(key, false);
      if (uploadedSuccessfully) {
        clearUploadProgress(key);
        clearUploadError(key);
      }
    }
  };

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    try {
      await action();
      setToastMessage(successMessage);
      await onRefresh();
    } catch (error) {
      setToastMessage(error instanceof Error ? localizeMessage(error.message) : copy.actionFailed);
    }
  };

  const confirmDelete = async () => {
    if (!confirmState) {
      return;
    }

    if (confirmState.type === "section") {
      await runAction(() => apiClient.deleteSection(confirmState.id).then(() => undefined), copy.sectionRemoved);
      onGoHome();
    } else {
      await runAction(() => apiClient.deleteBlock(confirmState.id).then(() => undefined), copy.blockRemoved);
    }

    setConfirmState(null);
  };

  const renderUploadField = (
    uploadKey: string,
    currentUrl: string,
    onUploaded: (url: string) => void,
  ) => (
    <>
      <div className="field-group span-two upload-field-group">
        <span>{copy.uploadLocalImage}</span>
        <label className="file-upload-button">
          <input
            type="file"
            accept="image/*"
            disabled={Boolean(uploadingTargets[uploadKey])}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = "";
              if (!file) {
                return;
              }
              void uploadImageIntoDraft(file, uploadKey, onUploaded);
            }}
          />
          <strong>{uploadingTargets[uploadKey] ? copy.uploadingImage : copy.uploadLocalImage}</strong>
          <small>{currentUrl || copy.storedImage}</small>
        </label>
        {typeof uploadProgressTargets[uploadKey] === "number" ? (
          <div className="upload-progress-shell" aria-live="polite">
            <div className="upload-progress-meta">
              <span>{copy.uploadProgressLabel}</span>
              <strong>{uploadProgressTargets[uploadKey]}%</strong>
            </div>
            <div className="upload-progress-track">
              <div className="upload-progress-bar" style={{ width: `${uploadProgressTargets[uploadKey]}%` }} />
            </div>
          </div>
        ) : null}
        {uploadErrorTargets[uploadKey] ? (
          <div className="upload-feedback-row">
            <span className="upload-feedback-error">{uploadErrorTargets[uploadKey]}</span>
            {uploadRetryFiles[uploadKey] ? (
              <button className="ghost-button compact-button" onClick={() => void uploadImageIntoDraft(uploadRetryFiles[uploadKey], uploadKey, onUploaded)}>
                {copy.uploadRetry}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <label className="field-group span-two">
        <span>{copy.storedImage}</span>
        <input value={currentUrl} readOnly />
      </label>
    </>
  );

  const renderHomeView = () => (
    <div className="story-content-column">
      <section id="home-hero" className="hero-panel archive-hero">
        <p className="eyebrow">{copy.archiveHome}</p>
        <div className="hero-preview-header">
          <div>
            <h2>{pickText(site.site_title, locale)}</h2>
            <p className="hero-tagline">{pickText(site.tagline, locale)}</p>
            <p className="hero-copy">{pickText(site.intro, locale)}</p>
          </div>
          {canEdit ? (
            <div className="hero-preview-actions">
              <span className="status-pill">{copy.livePreview}</span>
              <button className="ghost-button" onClick={() => setSiteProfileEditing((current) => !current)}>
                {siteProfileEditing ? copy.closeEditor : copy.editSiteProfile}
              </button>
            </div>
          ) : null}
        </div>

        {canEdit && siteProfileEditing ? (
          <div className="single-column-grid editor-surface">
            <label className="field-group">
              <span>
                {copy.sectionTitle} ({copy.english})
              </span>
              <input
                value={siteProfileDraft.site_title.en}
                onChange={(event) =>
                  setSiteProfileDraft((current) => ({
                    ...current,
                    site_title: { ...current.site_title, en: event.target.value },
                  }))
                }
              />
            </label>
            <label className="field-group">
              <span>
                {copy.sectionTitle} ({copy.chinese})
              </span>
              <input
                value={siteProfileDraft.site_title.zh}
                onChange={(event) =>
                  setSiteProfileDraft((current) => ({
                    ...current,
                    site_title: { ...current.site_title, zh: event.target.value },
                  }))
                }
              />
            </label>
            <label className="field-group">
              <span>
                {copy.siteTagline} ({copy.english})
              </span>
              <textarea
                value={siteProfileDraft.tagline.en}
                onChange={(event) =>
                  setSiteProfileDraft((current) => ({
                    ...current,
                    tagline: { ...current.tagline, en: event.target.value },
                  }))
                }
              />
            </label>
            <label className="field-group">
              <span>
                {copy.siteTagline} ({copy.chinese})
              </span>
              <textarea
                value={siteProfileDraft.tagline.zh}
                onChange={(event) =>
                  setSiteProfileDraft((current) => ({
                    ...current,
                    tagline: { ...current.tagline, zh: event.target.value },
                  }))
                }
              />
            </label>
            <label className="field-group">
              <span>
                {copy.siteIntro} ({copy.english})
              </span>
              <textarea
                value={siteProfileDraft.intro.en}
                onChange={(event) =>
                  setSiteProfileDraft((current) => ({
                    ...current,
                    intro: { ...current.intro, en: event.target.value },
                  }))
                }
              />
            </label>
            <label className="field-group">
              <span>
                {copy.siteIntro} ({copy.chinese})
              </span>
              <textarea
                value={siteProfileDraft.intro.zh}
                onChange={(event) =>
                  setSiteProfileDraft((current) => ({
                    ...current,
                    intro: { ...current.intro, zh: event.target.value },
                  }))
                }
              />
            </label>
            <div className="editor-action-row">
              <button
                className="action-button"
                onClick={() =>
                  void runAction(async () => {
                    await apiClient.updateSiteProfile(siteProfileDraft);
                    setSiteProfileEditing(false);
                  }, copy.siteProfileSaved)
                }
              >
                {copy.saveSiteProfile}
              </button>
              <button className="ghost-button" onClick={() => setSiteProfileEditing(false)}>
                {copy.closeEditor}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {query ? (
        <section id="home-search-results" className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{copy.searchResults}</p>
              <h3>{copy.searchResults}</h3>
            </div>
            <span className="section-count-copy">{formatCount(searchResults.length, copy.matchesLabel, locale)}</span>
          </div>
          {searchResults.length ? (
            <div className="search-result-list">
              {searchResults.map((result) => (
                <button key={result.key} className="search-result-card" onClick={() => onSelectSection(result.slug)}>
                  <span>{result.kind === "section" ? copy.sectionResult : copy.blockResult}</span>
                  <strong>{result.title}</strong>
                  <p>{result.excerpt}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-note">{copy.noSearchResults}</div>
          )}
        </section>
      ) : null}

      <section id="home-index" className="panel section-index-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{copy.sections}</p>
            <h3>{copy.archiveIndex}</h3>
          </div>
          <span className="section-count-copy">{formatCount(filteredSections.length, copy.sectionUnit, locale)}</span>
        </div>

        {filteredSections.length ? (
          <div className="section-card-grid">
            {filteredSections.map((section) => {
              const leadImage = getLeadImage(section);

              return (
                <article key={section.id} className="section-card">
                  <button className="section-card-hitbox" onClick={() => onSelectSection(section.slug)}>
                    <span className="section-card-order">{section.position.toString().padStart(2, "0")}</span>
                    <strong>{pickText(section.title, locale)}</strong>
                    <p>{pickText(section.summary, locale)}</p>
                  </button>
                  {leadImage ? (
                    <img className="section-card-image" src={leadImage} alt={pickText(section.title, locale)} />
                  ) : (
                    <div className="section-card-placeholder">
                      <span>{copy.textBlock}</span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="panel subtle-panel empty-panel">
            <p>{copy.noResults}</p>
          </div>
        )}
      </section>

      <section id="home-updates" className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{copy.logs}</p>
            <h3>{copy.recentUpdates}</h3>
          </div>
          <button className="ghost-button" onClick={onOpenLogs}>
            {copy.viewAllLogs}
          </button>
        </div>
        <div className="recent-updates-list">
          {recentEntries.length ? (
            recentEntries.map((entry) => (
              <article key={entry.id} className="recent-update-item">
                <span className="recent-update-time">{entry.changed_at}</span>
                <strong>{pickText(entry.content_title, locale)}</strong>
                <p>{pickText(entry.summary, locale)}</p>
              </article>
            ))
          ) : (
            <StatePanel compact title={copy.recentUpdates} description={copy.noRecentUpdates} />
          )}
        </div>
      </section>

      {canEdit ? (
        <section id="home-create" className="block-creator">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{copy.createSection}</p>
              <h3>{copy.createSectionInline}</h3>
            </div>
          </div>
          <div className="single-column-grid">
            <label className="field-group">
              <span>{copy.slug}</span>
              <input value={newSection.slug} onChange={(event) => setNewSection((current) => ({ ...current, slug: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>{copy.order}</span>
              <input
                type="number"
                value={newSection.position ?? ""}
                onChange={(event) =>
                  setNewSection((current) => ({
                    ...current,
                    position: event.target.value ? Number(event.target.value) : undefined,
                  }))
                }
              />
            </label>
            <label className="field-group">
              <span>
                {copy.sectionTitle} ({copy.english})
              </span>
              <input
                value={newSection.title.en}
                onChange={(event) =>
                  setNewSection((current) => ({
                    ...current,
                    title: { ...current.title, en: event.target.value },
                  }))
                }
              />
            </label>
            <label className="field-group">
              <span>
                {copy.sectionTitle} ({copy.chinese})
              </span>
              <input
                value={newSection.title.zh}
                onChange={(event) =>
                  setNewSection((current) => ({
                    ...current,
                    title: { ...current.title, zh: event.target.value },
                  }))
                }
              />
            </label>
            <label className="field-group">
              <span>
                {copy.sectionSummary} ({copy.english})
              </span>
              <textarea
                value={newSection.summary.en}
                onChange={(event) =>
                  setNewSection((current) => ({
                    ...current,
                    summary: { ...current.summary, en: event.target.value },
                  }))
                }
              />
            </label>
            <label className="field-group">
              <span>
                {copy.sectionSummary} ({copy.chinese})
              </span>
              <textarea
                value={newSection.summary.zh}
                onChange={(event) =>
                  setNewSection((current) => ({
                    ...current,
                    summary: { ...current.summary, zh: event.target.value },
                  }))
                }
              />
            </label>
          </div>
          <button
            className="action-button"
            onClick={() =>
              void runAction(async () => {
                const created = await apiClient.createSection(newSection);
                setNewSection(emptySection());
                onSelectSection(created.slug);
              }, copy.sectionCreated)
            }
          >
            {copy.addSection}
          </button>
        </section>
      ) : null}
    </div>
  );

  const renderSectionView = () => {
    if (!activeSection) {
      return (
        <div className="story-content-column">
          <StatePanel
            compact
            title={copy.sectionNotFoundTitle}
            description={copy.sectionNotFoundHint}
            actions={[
              { label: copy.returnToArchive, onClick: onGoHome },
              { label: copy.openLogs, tone: "ghost", onClick: onOpenLogs },
            ]}
          />
        </div>
      );
    }

    const sectionDraft = sectionDrafts[activeSection.id] ?? {
      slug: activeSection.slug,
      title: activeSection.title,
      summary: activeSection.summary,
      position: activeSection.position,
    };
    const newBlockDraft = newBlocks[activeSection.id] ?? {
      ...emptyBlock(),
      position: nextPosition(activeSection.blocks[activeSection.blocks.length - 1]?.position),
    };

    return (
      <div className="story-content-column">
        <section id="section-top" className="hero-panel section-hero-panel">
          <p className="eyebrow">{copy.sectionView}</p>
          {canEdit ? (
            <div className="section-editor-grid">
              <label className="field-group">
                <span>
                  {copy.sectionTitle} ({copy.english})
                </span>
                <input
                  value={sectionDraft.title.en}
                  onChange={(event) =>
                    updateSectionDraft(activeSection.id, {
                      title: { ...sectionDraft.title, en: event.target.value },
                    })
                  }
                />
              </label>
              <label className="field-group">
                <span>
                  {copy.sectionTitle} ({copy.chinese})
                </span>
                <input
                  value={sectionDraft.title.zh}
                  onChange={(event) =>
                    updateSectionDraft(activeSection.id, {
                      title: { ...sectionDraft.title, zh: event.target.value },
                    })
                  }
                />
              </label>
              <label className="field-group">
                <span>{copy.slug}</span>
                <input value={sectionDraft.slug} onChange={(event) => updateSectionDraft(activeSection.id, { slug: event.target.value })} />
              </label>
              <label className="field-group">
                <span>{copy.order}</span>
                <input
                  type="number"
                  value={sectionDraft.position ?? ""}
                  onChange={(event) =>
                    updateSectionDraft(activeSection.id, {
                      position: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                />
              </label>
              <label className="field-group span-two">
                <span>
                  {copy.sectionSummary} ({copy.english})
                </span>
                <textarea
                  value={sectionDraft.summary.en}
                  onChange={(event) =>
                    updateSectionDraft(activeSection.id, {
                      summary: { ...sectionDraft.summary, en: event.target.value },
                    })
                  }
                />
              </label>
              <label className="field-group span-two">
                <span>
                  {copy.sectionSummary} ({copy.chinese})
                </span>
                <textarea
                  value={sectionDraft.summary.zh}
                  onChange={(event) =>
                    updateSectionDraft(activeSection.id, {
                      summary: { ...sectionDraft.summary, zh: event.target.value },
                    })
                  }
                />
              </label>
            </div>
          ) : (
            <>
              <h2>{pickText(activeSection.title, locale)}</h2>
              <p className="hero-copy">{pickText(activeSection.summary, locale)}</p>
            </>
          )}

          {canEdit ? (
            <div className="editor-action-row">
              <button
                className="action-button"
                onClick={() =>
                  void runAction(async () => {
                    await apiClient.updateSection(activeSection.id, sectionDraft);
                    if (sectionDraft.slug !== activeSection.slug) {
                      onSelectSection(sectionDraft.slug);
                    }
                  }, copy.sectionSaved)
                }
              >
                {copy.saveCurrentSection}
              </button>
              <button className="ghost-button danger" onClick={() => setConfirmState({ type: "section", id: activeSection.id })}>
                {copy.deleteCurrentSection}
              </button>
            </div>
          ) : null}
        </section>

        <section id="section-blocks" className={`panel section-block-panel ${canEdit ? "" : "reading-section-panel"}`}>
          {canEdit ? (
            <div className="panel-header">
              <div>
                <p className="eyebrow">{copy.contentBlocks}</p>
                <h3>{copy.sectionCanvas}</h3>
              </div>
              <span className="section-count-copy">{formatCount(visibleBlocks.length, copy.blockUnit, locale)}</span>
            </div>
          ) : null}

          {visibleBlocks.length ? (
            <div className={canEdit ? "block-grid" : "block-grid reading-block-grid"}>
              {visibleBlocks.map((block) => {
                const blockDraft = blockDrafts[block.id] ?? {
                  title: block.title,
                  kind: block.kind,
                  content: block.content,
                  image_url: block.image_url,
                  position: block.position,
                };
                const uploadKey = `block-${block.id}`;

                return (
                  <article
                    id={`block-${block.id}`}
                    key={block.id}
                    className={`content-card ${block.kind === "image" ? "media-card" : ""} ${!canEdit ? "reading-card" : ""} ${
                      !canEdit && block.kind === "text" ? "reading-text-card" : ""
                    } ${!canEdit && block.kind === "image" ? "reading-media-card" : ""}`}
                  >
                    {canEdit ? <div className="editor-chip">{copy.liveEditor}</div> : null}

                    {canEdit ? (
                      <div className="content-editor-grid">
                        <label className="field-group">
                          <span>
                            {copy.blockTitle} ({copy.english})
                          </span>
                          <input
                            value={blockDraft.title.en}
                            onChange={(event) =>
                              updateBlockDraft(block.id, {
                                title: { ...blockDraft.title, en: event.target.value },
                              })
                            }
                          />
                        </label>
                        <label className="field-group">
                          <span>
                            {copy.blockTitle} ({copy.chinese})
                          </span>
                          <input
                            value={blockDraft.title.zh}
                            onChange={(event) =>
                              updateBlockDraft(block.id, {
                                title: { ...blockDraft.title, zh: event.target.value },
                              })
                            }
                          />
                        </label>
                        <label className="field-group">
                          <span>{copy.blockKind}</span>
                          <select
                            value={blockDraft.kind}
                            onChange={(event) =>
                              updateBlockDraft(block.id, { kind: event.target.value as BlockPayload["kind"] })
                            }
                          >
                            <option value="text">{copy.textBlock}</option>
                            <option value="image">{copy.imageBlock}</option>
                          </select>
                        </label>
                        <label className="field-group">
                          <span>{copy.order}</span>
                          <input
                            type="number"
                            value={blockDraft.position ?? ""}
                            onChange={(event) =>
                              updateBlockDraft(block.id, {
                                position: event.target.value ? Number(event.target.value) : undefined,
                              })
                            }
                          />
                        </label>

                        {blockDraft.kind === "image"
                          ? renderUploadField(uploadKey, blockDraft.image_url, (url) => updateBlockDraft(block.id, { image_url: url }))
                          : null}

                        {blockDraft.kind === "image" && blockDraft.image_url ? (
                          <img className="story-image" src={blockDraft.image_url} alt={pickText(blockDraft.title, locale)} />
                        ) : null}

                        <label className="field-group span-two">
                          <span>
                            {copy.bodyCopy} ({copy.english})
                          </span>
                          <textarea
                            value={blockDraft.content.en}
                            onChange={(event) =>
                              updateBlockDraft(block.id, {
                                content: { ...blockDraft.content, en: event.target.value },
                              })
                            }
                          />
                        </label>
                        <label className="field-group span-two">
                          <span>
                            {copy.bodyCopy} ({copy.chinese})
                          </span>
                          <textarea
                            value={blockDraft.content.zh}
                            onChange={(event) =>
                              updateBlockDraft(block.id, {
                                content: { ...blockDraft.content, zh: event.target.value },
                              })
                            }
                          />
                        </label>
                        <div className="editor-action-row span-two">
                          <button
                            className="action-button"
                            onClick={() =>
                              void runAction(() => apiClient.updateBlock(block.id, blockDraft).then(() => undefined), copy.blockSaved)
                            }
                          >
                            {copy.saveChanges}
                          </button>
                          <button className="ghost-button danger" onClick={() => setConfirmState({ type: "block", id: block.id })}>
                            {copy.deleteBlock}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="content-card-header reading-card-header">
                          <strong>{pickText(block.title, locale)}</strong>
                        </div>

                        {block.kind === "image" ? (
                          block.image_url ? (
                            <figure className="reading-figure">
                              <img className="story-image reading-image" src={block.image_url} alt={pickText(block.title, locale)} />
                              <figcaption>{pickText(block.content, locale)}</figcaption>
                            </figure>
                          ) : (
                            <div className="section-card-placeholder reading-placeholder">
                              <span>{copy.imageBlock}</span>
                            </div>
                          )
                        ) : (
                          <div className="reading-body">
                            {getReadingParagraphs(pickText(block.content, locale)).map((paragraph, index) => (
                              <p key={`${block.id}-paragraph-${index}`}>{paragraph}</p>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="panel subtle-panel empty-panel">
              <p>{copy.noBlocksFound}</p>
            </div>
          )}
        </section>

        {canEdit ? (
          <section id="section-create" className="block-creator">
            <div className="panel-header">
              <div>
                <p className="eyebrow">{copy.liveEditor}</p>
                <h3>{copy.addBlockInline}</h3>
              </div>
            </div>
            <div className="dual-language-grid">
              <label className="field-group">
                <span>
                  {copy.blockTitle} ({copy.english})
                </span>
                <input
                  value={newBlockDraft.title.en}
                  onChange={(event) =>
                    updateNewBlockDraft(activeSection.id, {
                      title: { ...newBlockDraft.title, en: event.target.value },
                    })
                  }
                />
              </label>
              <label className="field-group">
                <span>
                  {copy.blockTitle} ({copy.chinese})
                </span>
                <input
                  value={newBlockDraft.title.zh}
                  onChange={(event) =>
                    updateNewBlockDraft(activeSection.id, {
                      title: { ...newBlockDraft.title, zh: event.target.value },
                    })
                  }
                />
              </label>
              <label className="field-group">
                <span>{copy.blockKind}</span>
                <select
                  value={newBlockDraft.kind}
                  onChange={(event) =>
                    updateNewBlockDraft(activeSection.id, { kind: event.target.value as BlockPayload["kind"] })
                  }
                >
                  <option value="text">{copy.textBlock}</option>
                  <option value="image">{copy.imageBlock}</option>
                </select>
              </label>
              <label className="field-group">
                <span>{copy.order}</span>
                <input
                  type="number"
                  value={newBlockDraft.position ?? ""}
                  onChange={(event) =>
                    updateNewBlockDraft(activeSection.id, {
                      position: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                />
              </label>

              {newBlockDraft.kind === "image"
                ? renderUploadField(`new-${activeSection.id}`, newBlockDraft.image_url, (url) =>
                    updateNewBlockDraft(activeSection.id, { image_url: url }),
                  )
                : null}

              {newBlockDraft.kind === "image" && newBlockDraft.image_url ? (
                <img className="story-image span-two" src={newBlockDraft.image_url} alt={pickText(newBlockDraft.title, locale)} />
              ) : null}

              <label className="field-group span-two">
                <span>
                  {copy.bodyCopy} ({copy.english})
                </span>
                <textarea
                  value={newBlockDraft.content.en}
                  onChange={(event) =>
                    updateNewBlockDraft(activeSection.id, {
                      content: { ...newBlockDraft.content, en: event.target.value },
                    })
                  }
                />
              </label>
              <label className="field-group span-two">
                <span>
                  {copy.bodyCopy} ({copy.chinese})
                </span>
                <textarea
                  value={newBlockDraft.content.zh}
                  onChange={(event) =>
                    updateNewBlockDraft(activeSection.id, {
                      content: { ...newBlockDraft.content, zh: event.target.value },
                    })
                  }
                />
              </label>
            </div>
            <button
              className="action-button"
              onClick={() =>
                void runAction(async () => {
                  await apiClient.createBlock(activeSection.id, newBlockDraft);
                  setNewBlocks((current) => ({
                    ...current,
                    [activeSection.id]: {
                      ...emptyBlock(),
                      position: nextPosition(newBlockDraft.position),
                    },
                  }));
                }, copy.blockInserted)
              }
            >
              {copy.insertBlock}
            </button>
          </section>
        ) : null}
      </div>
    );
  };

  const renderSubNavigation = () => {
    const systemLinks = [
      { key: "home", label: copy.home, action: onGoHome },
      { key: "logs", label: copy.logs, action: onOpenLogs },
    ];

    if (activeSection) {
      return (
        <aside className="story-subnav">
          <div className="subnav-panel">
            <div className="subnav-heading">
              <p className="eyebrow">{copy.subNavigation}</p>
              <h3>{pickText(activeSection.title, locale)}</h3>
            </div>

            <div className="subnav-group">
              <span className="subnav-label">{copy.sectionOutline}</span>
              <div className="subnav-links">
                <button className="subnav-link" onClick={() => scrollToElement("section-top")}>
                  {copy.overview}
                </button>
                <button className="subnav-link" onClick={() => scrollToElement("section-blocks")}>
                  {copy.contentBlocks}
                </button>
                {visibleBlocks.map((block) => (
                  <button key={block.id} className="subnav-link" onClick={() => scrollToElement(`block-${block.id}`)}>
                    {pickText(block.title, locale)}
                  </button>
                ))}
                {canEdit ? (
                  <button className="subnav-link accent" onClick={() => scrollToElement("section-create")}>
                    {copy.addBlockInline}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="subnav-group">
              <span className="subnav-label">{copy.systemLinks}</span>
              <div className="subnav-links">
                {systemLinks.map((link) => (
                  <button key={link.key} className="subnav-link muted" onClick={link.action}>
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      );
    }

    return (
      <aside className="story-subnav">
        <div className="subnav-panel">
          <div className="subnav-heading">
            <p className="eyebrow">{copy.subNavigation}</p>
            <h3>{copy.archiveIndex}</h3>
          </div>

          <div className="subnav-group">
            <span className="subnav-label">{copy.archiveOutline}</span>
            <div className="subnav-links">
              <button className="subnav-link" onClick={() => scrollToElement("home-hero")}>
                {copy.overview}
              </button>
              {query ? (
                <button className="subnav-link" onClick={() => scrollToElement("home-search-results")}>
                  {copy.searchResults}
                </button>
              ) : null}
              <button className="subnav-link" onClick={() => scrollToElement("home-index")}>
                {copy.sections}
              </button>
              <button className="subnav-link" onClick={() => scrollToElement("home-updates")}>
                {copy.recentUpdates}
              </button>
              {canEdit ? (
                <button className="subnav-link accent" onClick={() => scrollToElement("home-create")}>
                  {copy.createSection}
                </button>
              ) : null}
            </div>
          </div>

          <div className="subnav-group">
            <span className="subnav-label">{query ? copy.searchResults : copy.sections}</span>
            <div className="subnav-links">
              {(query
                ? searchResults.map((result) => ({ key: result.key, label: result.title, slug: result.slug }))
                : filteredSections.map((section) => ({
                    key: `section-${section.id}`,
                    label: pickText(section.title, locale),
                    slug: section.slug,
                  }))
              )
                .slice(0, 6)
                .map((item) => (
                  <button key={item.key} className="subnav-link" onClick={() => onSelectSection(item.slug)}>
                    {item.label}
                  </button>
                ))}
            </div>
          </div>

          <div className="subnav-group">
            <span className="subnav-label">{copy.systemLinks}</span>
            <div className="subnav-links">
              {systemLinks.map((link) => (
                <button key={link.key} className="subnav-link muted" onClick={link.action}>
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    );
  };

  return (
    <section className={sidebarCollapsed ? "story-page sidebar-collapsed" : "story-page"}>
      <Toast message={toastMessage} />
      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.type === "section" ? copy.deleteSectionTitle : copy.deleteBlockTitle}
        description={confirmState?.type === "section" ? copy.deleteSectionDescription : copy.deleteBlockDescription}
        confirmLabel={copy.confirmDelete}
        cancelLabel={copy.cancel}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setConfirmState(null)}
      />

      <aside className={sidebarCollapsed ? "story-sidebar collapsed" : "story-sidebar"}>
        <div className="sidebar-card">
          <div className="sidebar-heading">
            <div className="sidebar-heading-copy">
              <p className="eyebrow sidebar-eyebrow">{copy.navigation}</p>
              <h2 className="sidebar-title">{copy.sections}</h2>
            </div>
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed((current) => !current)}
              aria-label={sidebarCollapsed ? copy.expandNav : copy.collapseNav}
            >
              {sidebarCollapsed ? ">>>" : "<<<"}
            </button>
          </div>

          <button className={activeSection ? "sidebar-link" : "sidebar-link active"} onClick={onGoHome}>
            <span>00</span>
            <strong>{copy.archiveIndex}</strong>
          </button>
          <div className="sidebar-divider" />
          <nav className="sidebar-nav">
            {site.sections.map((section) => (
              <button
                key={section.id}
                className={section.slug === activeSectionSlug ? "sidebar-link active" : "sidebar-link"}
                onClick={() => onSelectSection(section.slug)}
              >
                <span>{section.position.toString().padStart(2, "0")}</span>
                <strong>{pickText(section.title, locale)}</strong>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="story-main">
        {activeSectionSlug ? renderSectionView() : renderHomeView()}
        {renderSubNavigation()}
      </main>
    </section>
  );
}
