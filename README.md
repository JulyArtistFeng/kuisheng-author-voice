# 《窥生》小说创作与校验 Skill

当前版本：**v2.1 · 去结算与主线重整版（2026-11-11）**。

按作者自创《窥生》新旧篇章的个人文风创作、续写与修订小说，涵盖主线、人物关系、场景体验和长篇连续性校验。

## 文件入口

- [SKILL.md](SKILL.md)：技能主入口。
- [references/](references/)：文风画像、原文锚点、场景体验与故事结构等配套参考。
- [scripts/](scripts/)：语料分析与技能检查脚本。
- [agents/openai.yaml](agents/openai.yaml)：界面元数据；原发布包中的显示名称仍标注 v2.0，实际维护版本以 SKILL.md 中的 v2.1 为准。

## 安装与使用

将本仓库克隆到 Codex 用户技能目录中的 `kuisheng-author-voice` 文件夹，或将下载的仓库内容复制到该文件夹。保留 SKILL.md、references、scripts 和 agents 的相对位置。

```text
请使用 $kuisheng-author-voice，按我的《窥生》新旧稿文风完成这次小说创作或修订。
```

## 检查

在仓库根目录运行：

```sh
node scripts/validate-skill.mjs
```

`--check-sources` 需要原作者本机上的源稿路径。配套语料画像中的本地路径用于来源追溯，使用者无需具备这些文件即可阅读和使用技能。

## 版本来源

本次发布提取自 `kuisheng-author-voice-v2.1-去结算主线重整版-20261111.zip`，与作者当前同名技能目录逐文件一致。保留原发布包内容，不附带旧版压缩包或额外小说正文文件。
