const axios = require('axios');
const nodemailer = require('nodemailer');

// 配置信息（建议通过 GitHub Secrets 注入）
const CONFIG = {
    PUSH_KEY: process.env.PUSH_KEY,
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASS: process.env.MAIL_PASS,
    MAIL_TO: process.env.MAIL_TO || process.env.MAIL_USER,
    APP_CODE:'252aca7da7ef46bbaf466514a18eeb52',
    // 策略设置
    TARGET_PRICE: 900,      // 价格超过 900 提醒
    TARGET_CHG_RATE: 4.0,    // 涨幅超过 4.0% 提醒
    API_URL: 'https://autd.market.alicloudapi.com/sge/price?symbol=AUTD'
};

async function main() {
    try {
        const res = await axios.get(CONFIG.API_URL, {
            headers: {
                // 常见的阿里云接口鉴权格式如下：
                'Authorization': `APPCODE ${CONFIG.APP_CODE}`,
                // 如果有特殊需求可以继续添加其他 header
                'Content-Type': 'application/json; charset=utf-8'
            }
        });

        // --- 精准对接你的接口格式 ---
        const goldData = res.data.data;
        const name = goldData.name;           // "黄金T+D"
        const currentPrice = goldData.price;  // 1019.7
        const changeRate = goldData.changeRate; // 4.82 (对应你给的数据)
        const updateTime = new Date(goldData.update_time * 1000).toLocaleString();
        // --------------------------

        console.log(`[${updateTime}] ${name}: 当前价 ${currentPrice}, 涨幅 ${changeRate}%`);

        // 判断逻辑：价格超标 OR 涨幅超标
        if (currentPrice >= CONFIG.TARGET_PRICE || changeRate >= CONFIG.TARGET_CHG_RATE) {
            console.log('符合提醒条件，正在触发通知...');

            const title = `⚠️ 金价预警：${name} 涨幅 ${changeRate}%`;
            const content = `
                <h3>积存金/黄金监控报告</h3>
                <p><b>品种：</b>${name}</p>
                <p><b>当前价格：</b>${currentPrice}</p>
                <p><b>今日涨幅：</b><span style="color:red">${changeRate}%</span></p>
                <p><b>最高价：</b>${goldData.high}</p>
                <p><b>更新时间：</b>${updateTime}</p>
            `;

            await Promise.all([
                pushWechat(title, content),
                sendEmail(title, content)
            ]);
        } else {
            console.log('波动在正常范围内。');
        }
    } catch (e) {
        console.error('监控运行出错:', e.message);
    }
}

// 微信推送封装
async function pushWechat(title, content) {
    try {
        await axios.get(`https://api2.pushdeer.com/message/push`, {
            params: {
                pushkey: CONFIG.PUSH_KEY,
                text: title,
                desp: content,
                type: 'markdown'
            }
        });
        console.log('微信推送成功');
    } catch (e) { console.error('微信推送失败'); }
}

// 邮件推送封装
async function sendEmail(title, content) {
    let transporter = nodemailer.createTransport({
        service: 'qq',
        auth: { user: CONFIG.MAIL_USER, pass: CONFIG.MAIL_PASS }
    });
    try {
        await transporter.sendMail({
            from: `"金价助手" <${CONFIG.MAIL_USER}>`,
            to: CONFIG.MAIL_TO,
            subject: title,
            html: content
        });
        console.log('邮件发送成功');
    } catch (e) { console.error('邮件发送失败'); }
}

main();