# 💰 积存金/黄金 T+D 实时监控助手

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-Automated-blue.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

这是一个基于 **GitHub Actions** 的自动化金价监控工具。无需服务器，每小时自动抓取实时金价（黄金 T+D），并在达到预设阈值或涨幅过大时，通过 **微信 (PushDeer)** 和 **电子邮件** 发送双重预警。

## ✨ 功能特性

* **实时监控**：对接阿里云专业金融接口，获取精准金价。
* **双重预警**：支持微信推送（秒级提醒）和邮件通知。
* **多维判断**：支持「价格阈值」和「涨幅百分比」双重逻辑报警。
* **零成本运行**：利用 GitHub Actions 云端部署，完全免费且无需维护。
* **隐私安全**：敏感 API Key 全部通过 GitHub Secrets 加密，代码公开但配置私有。

---

## 🚀 快速上手 (如何克隆并运行)

如果你想使用这个工具监控自己的金价，请按照以下步骤操作：

### 1. Fork 本项目
点击页面右上角的 **Fork** 按钮，将本项目克隆到你自己的 GitHub 账号下。

### 2. 准备密钥
你需要准备以下四个凭证：
* **ALI_APP_CODE**: 阿里云 API 市场获取的 AppCode。
* **PUSH_KEY**: [PushDeer](https://www.pushdeer.com/) 获取的推送 Key。
* **MAIL_USER**: 你的发信邮箱（如 QQ/网易）。
* **MAIL_PASS**: 邮箱设置中开启 SMTP 服务后生成的**授权码**。

### 3. 配置 GitHub Secrets (核心步骤)
在**你自己**的仓库页面中：
1.  点击顶部菜单 **Settings**。
2.  左侧选择 **Secrets and variables** -> **Actions**。
3.  点击 **New repository secret**，依次添加上述四个变量。

### 4. 激活自动化任务
1.  点击仓库顶部的 **Actions** 选项卡。
2.  点击左侧的 `Gold Price Bot`。
3.  点击右侧蓝色条框 **Run workflow** 手动触发第一次测试。
4.  之后脚本将根据 `cron` 设置，每小时自动运行。

---

## 🛠️ 技术栈

* **Runtime**: Node.js 18+
* **Network**: Axios
* **Notification**: Nodemailer & PushDeer API
* **Automation**: GitHub Actions

## ⚠️ 免责声明
1. 本项目仅供学习和技术交流使用，不构成任何投资建议。
2. 请确保遵守 API 服务商的使用协议，合理设置监控频率。
3. 金融市场有风险，入市需谨慎。

## 📄 开源协议
基于 [MIT License](LICENSE) 开源。
