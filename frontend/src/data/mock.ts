import type { SiteResponse } from "./types";

export const fallbackSite: SiteResponse = {
  site_title: {
    en: "Sci-Fi Novel Introduction",
    zh: "\u79d1\u5e7b\u5c0f\u8bf4\u4ecb\u7ecd",
  },
  tagline: {
    en: "A bilingual sci-fi novel introduction site for story worlds, visuals, and editorial history.",
    zh: "\u4e00\u4e2a\u7528\u4e8e\u5c55\u793a\u79d1\u5e7b\u5c0f\u8bf4\u4e16\u754c\u89c2\u3001\u89c6\u89c9\u4e0e\u7f16\u8f91\u5386\u53f2\u7684\u4e2d\u82f1\u6587\u4ecb\u7ecd\u7ad9\u3002",
  },
  intro: {
    en: "Browse each section from the edge-pinned sidebar, switch between Chinese and English, choose from day, night, mist, or eye-care amber palettes, and sign in only when you need to edit sci-fi novel text or images in place.",
    zh: "\u4ece\u8d34\u8fb9\u4fa7\u8fb9\u680f\u6d4f\u89c8\u5404\u4e2a\u677f\u5757\uff0c\u5207\u6362\u4e2d\u82f1\u6587\uff0c\u5e76\u5728\u767d\u5929\u3001\u9ed1\u591c\u3001\u96fe\u84dd\u548c\u62a4\u773c\u9ec4\u4e3b\u9898\u4e4b\u95f4\u5207\u6362\uff0c\u9700\u8981\u4fee\u6539\u79d1\u5e7b\u5c0f\u8bf4\u6587\u5b57\u4e0e\u56fe\u7247\u65f6\u518d\u767b\u5f55\u5373\u53ef\u76f4\u63a5\u7f16\u8f91\u3002",
  },
  sections: [
    {
      id: 1,
      slug: "story-overview",
      title: {
        en: "Story Overview",
        zh: "\u6545\u4e8b\u6982\u89c8",
      },
      summary: {
        en: "Introduce the city, the central mystery, and the emotional weight of memory restoration.",
        zh: "\u4ecb\u7ecd\u8fd9\u5ea7\u57ce\u5e02\u3001\u4e3b\u8981\u60ac\u5ff5\uff0c\u4ee5\u53ca\u8bb0\u5fc6\u4fee\u590d\u8fd9\u4ef6\u4e8b\u672c\u8eab\u7684\u60c5\u7eea\u91cd\u91cf\u3002",
      },
      position: 1,
      blocks: [
        {
          id: 1,
          section_id: 1,
          title: {
            en: "Synopsis",
            zh: "\u4f5c\u54c1\u7b80\u4ecb",
          },
          kind: "text",
          content: {
            en: "The Silent Corridor follows an archivist rebuilding her stolen past in a city where public memory is curated like state property.",
            zh: "\u300a\u5bc2\u9759\u56de\u5eca\u300b\u8bb2\u8ff0\u4e00\u4f4d\u6863\u6848\u5e08\u5728\u201c\u8bb0\u5fc6\u88ab\u516c\u5171\u7f16\u6392\u201d\u7684\u57ce\u5e02\u4e2d\uff0c\u91cd\u5efa\u81ea\u5df1\u88ab\u593a\u53d6\u7684\u8fc7\u53bb\u3002",
          },
          image_url: "",
          position: 1,
        },
        {
          id: 2,
          section_id: 1,
          title: {
            en: "Lead Poster",
            zh: "\u4e3b\u6d77\u62a5",
          },
          kind: "image",
          content: {
            en: "A lamp-lit corridor and suspended dust shape the opening mood.",
            zh: "\u706f\u5149\u4e0b\u7684\u957f\u5eca\u548c\u60ac\u6d6e\u7684\u7070\u5c18\u5b9a\u4e0b\u4e86\u5f00\u573a\u7684\u6c14\u606f\u3002",
          },
          image_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
          position: 2,
        },
      ],
    },
    {
      id: 2,
      slug: "characters",
      title: {
        en: "Character Ensemble",
        zh: "\u4eba\u7269\u7fa4\u50cf",
      },
      summary: {
        en: "Lay out the lead trio and the emotional pressure each one exerts on the story.",
        zh: "\u5c55\u5f00\u4e3b\u8981\u4e09\u4eba\u7ec4\uff0c\u5e76\u4ea4\u4ee3\u4ed6\u4eec\u5404\u81ea\u4e3a\u6545\u4e8b\u5e26\u6765\u7684\u60c5\u7eea\u538b\u529b\u3002",
      },
      position: 2,
      blocks: [
        {
          id: 3,
          section_id: 2,
          title: {
            en: "Lin Wu",
            zh: "\u6797\u96fe",
          },
          kind: "text",
          content: {
            en: "Lin hears emotion inside damaged text, which turns restoration into a dangerous intimacy.",
            zh: "\u6797\u96fe\u53ef\u4ee5\u4ece\u7834\u635f\u6587\u5b57\u91cc\u201c\u542c\u89c1\u201d\u60c5\u7eea\uff0c\u4e5f\u8ba9\u4fee\u590d\u8fd9\u4ef6\u4e8b\u53d8\u6210\u4e00\u79cd\u5371\u9669\u7684\u4eb2\u5bc6\u3002",
          },
          image_url: "",
          position: 1,
        },
        {
          id: 4,
          section_id: 2,
          title: {
            en: "Character Wall",
            zh: "\u4eba\u7269\u5173\u7cfb\u5899",
          },
          kind: "image",
          content: {
            en: "Pinned photographs and string routes capture the cast structure.",
            zh: "\u7167\u7247\u3001\u5f15\u7ebf\u548c\u6807\u7b7e\u7ec4\u6210\u4e86\u4eba\u7269\u7ed3\u6784\u56fe\u3002",
          },
          image_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
          position: 2,
        },
      ],
    },
    {
      id: 3,
      slug: "world-building",
      title: {
        en: "World Building",
        zh: "\u4e16\u754c\u8bbe\u5b9a",
      },
      summary: {
        en: "Explain the lamp districts, echo vaults, and the sealed northern tower.",
        zh: "\u8bf4\u660e\u706f\u533a\u3001\u56de\u58f0\u5e93\uff0c\u4ee5\u53ca\u88ab\u5c01\u95ed\u7684\u5317\u5854\u533a\u3002",
      },
      position: 3,
      blocks: [
        {
          id: 5,
          section_id: 3,
          title: {
            en: "Old City Map",
            zh: "\u65e7\u57ce\u5730\u56fe",
          },
          kind: "image",
          content: {
            en: "The city is divided into lamp districts, echo vaults, and a northern quarantine tower.",
            zh: "\u6574\u5ea7\u57ce\u5e02\u88ab\u5206\u4e3a\u706f\u533a\u3001\u56de\u58f0\u5e93\uff0c\u4ee5\u53ca\u5317\u90e8\u9694\u79bb\u5854\u3002",
          },
          image_url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
          position: 1,
        },
      ],
    },
    {
      id: 4,
      slug: "visual-motifs",
      title: {
        en: "Visual Motifs",
        zh: "\u89c6\u89c9\u6bcd\u9898",
      },
      summary: {
        en: "Collect the recurring objects, textures, and weather conditions that define the novel.",
        zh: "\u6574\u7406\u8d2f\u7a7f\u5168\u4e66\u7684\u7269\u4ef6\u3001\u8d28\u611f\u4e0e\u5929\u6c14\u6bcd\u9898\u3002",
      },
      position: 4,
      blocks: [
        {
          id: 6,
          section_id: 4,
          title: {
            en: "Rain Archive",
            zh: "\u96e8\u591c\u6863\u6848",
          },
          kind: "text",
          content: {
            en: "Rain is described not as weather but as an acoustic veil over the city.",
            zh: "\u96e8\u5728\u8fd9\u90e8\u5c0f\u8bf4\u91cc\u4e0d\u53ea\u662f\u5929\u6c14\uff0c\u66f4\u50cf\u662f\u7b3c\u5728\u57ce\u5e02\u4e0a\u7a7a\u7684\u58f0\u5b66\u5e55\u5e03\u3002",
          },
          image_url: "",
          position: 1,
        },
      ],
    },
  ],
  change_logs: [
    {
      id: 1,
      actor: "admin@scifi.local",
      action: "update",
      section_title: {
        en: "Story Overview",
        zh: "\u6545\u4e8b\u6982\u89c8",
      },
      content_title: {
        en: "Synopsis",
        zh: "\u4f5c\u54c1\u7b80\u4ecb",
      },
      summary: {
        en: 'Updated "Synopsis" in "Story Overview".',
        zh: '\u5df2\u66f4\u65b0\u300c\u6545\u4e8b\u6982\u89c8\u300d\u4e2d\u7684\u300c\u4f5c\u54c1\u7b80\u4ecb\u300d\u3002',
      },
      changed_at: "2026-04-28 11:00",
    },
    {
      id: 2,
      actor: "admin@scifi.local",
      action: "create",
      section_title: {
        en: "Character Ensemble",
        zh: "\u4eba\u7269\u7fa4\u50cf",
      },
      content_title: {
        en: "Character Wall",
        zh: "\u4eba\u7269\u5173\u7cfb\u5899",
      },
      summary: {
        en: 'Created "Character Wall" in "Character Ensemble".',
        zh: '\u5df2\u5728\u300c\u4eba\u7269\u7fa4\u50cf\u300d\u4e2d\u65b0\u589e\u300c\u4eba\u7269\u5173\u7cfb\u5899\u300d\u3002',
      },
      changed_at: "2026-04-27 20:40",
    },
    {
      id: 3,
      actor: "admin@scifi.local",
      action: "create",
      section_title: {
        en: "World Building",
        zh: "\u4e16\u754c\u8bbe\u5b9a",
      },
      content_title: {
        en: "Old City Map",
        zh: "\u65e7\u57ce\u5730\u56fe",
      },
      summary: {
        en: 'Created "Old City Map" in "World Building".',
        zh: '\u5df2\u5728\u300c\u4e16\u754c\u8bbe\u5b9a\u300d\u4e2d\u65b0\u589e\u300c\u65e7\u57ce\u5730\u56fe\u300d\u3002',
      },
      changed_at: "2026-04-26 16:15",
    },
    {
      id: 4,
      actor: "admin@scifi.local",
      action: "delete",
      section_title: {
        en: "Visual Motifs",
        zh: "\u89c6\u89c9\u6bcd\u9898",
      },
      content_title: {
        en: "Dust Notes",
        zh: "\u7070\u5c18\u7b14\u8bb0",
      },
      summary: {
        en: 'Deleted "Dust Notes" in "Visual Motifs".',
        zh: '\u5df2\u5220\u9664\u300c\u89c6\u89c9\u6bcd\u9898\u300d\u4e2d\u7684\u300c\u7070\u5c18\u7b14\u8bb0\u300d\u3002',
      },
      changed_at: "2026-04-24 09:10",
    },
  ],
};
