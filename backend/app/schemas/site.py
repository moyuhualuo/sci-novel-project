from pydantic import BaseModel, Field


class LocalizedText(BaseModel):
    en: str
    zh: str


class ContentBlockResponse(BaseModel):
    id: int
    section_id: int
    title: LocalizedText
    kind: str
    content: LocalizedText
    image_url: str
    position: int


class NovelSectionResponse(BaseModel):
    id: int
    slug: str
    title: LocalizedText
    summary: LocalizedText
    position: int
    blocks: list[ContentBlockResponse]


class ChangeLogItem(BaseModel):
    id: int
    actor: str
    action: str
    section_title: LocalizedText
    content_title: LocalizedText
    summary: LocalizedText
    changed_at: str


class SiteResponse(BaseModel):
    site_title: LocalizedText
    tagline: LocalizedText
    intro: LocalizedText
    sections: list[NovelSectionResponse]
    change_logs: list[ChangeLogItem]


class SiteProfileResponse(BaseModel):
    site_title: LocalizedText
    tagline: LocalizedText
    intro: LocalizedText


class ChangeLogResponse(BaseModel):
    entries: list[ChangeLogItem]


class LocalizedTextInput(BaseModel):
    en: str = Field(min_length=1)
    zh: str = Field(min_length=1)


class NovelSectionBase(BaseModel):
    slug: str = Field(min_length=2, max_length=120)
    title: LocalizedTextInput
    summary: LocalizedTextInput
    position: int | None = None


class NovelSectionCreate(NovelSectionBase):
    pass


class NovelSectionUpdate(NovelSectionBase):
    pass


class ContentBlockBase(BaseModel):
    title: LocalizedTextInput
    kind: str = Field(pattern="^(text|image)$")
    content: LocalizedTextInput
    image_url: str = ""
    position: int | None = None


class ContentBlockCreate(ContentBlockBase):
    pass


class ContentBlockUpdate(ContentBlockBase):
    pass


class ImageUploadRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=120)
    data_base64: str = Field(min_length=8)


class ImageUploadResponse(BaseModel):
    url: str
    filename: str


class SiteProfileUpdate(BaseModel):
    site_title: LocalizedTextInput
    tagline: LocalizedTextInput
    intro: LocalizedTextInput
