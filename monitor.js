const axios = require('axios');
const nodemailer = require('nodemailer');

// 1. 配置信息：从 GitHub Secrets 环境变量中读取
const CONFIG = {
    // 接口配置
    API_URL: 'https://autd.market.alicloudapi.com/sge/price?symbol=AUTD',
    APP_CODE: process.env.ALI_APP_CODE,

    // 企业微信配置
    WEWORK_CORPID: process.env.WEWORK_CORPID,
    WEWORK_AGENTID: process.env.WEWORK_AGENTID,
    WEWORK_SECRET: process.env.WEWORK_SECRET,

    // 邮件配置
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASS: process.env.MAIL_PASS,
    MAIL_TO: process.env.MAIL_TO || process.env.MAIL_USER,

    // 监控策略设置
    TARGET_PRICE: 900,      // 价格超过 900 提醒
    TARGET_CHG_RATE: 4.0    // 涨幅超过 4.0% 提醒
};

/**
 * 企业微信推送函数 (发送文本卡片)
 */
async function pushWeWork(title, price, changeRate, high, time) {
    try {
        // 1. 获取 Access Token
        // 建议在这里加上 .trim() 防止环境变量里意外带入空格
        const corpid = CONFIG.WEWORK_CORPID.trim();
        const secret = CONFIG.WEWORK_SECRET.trim();
        
        const tokenUrl = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret=${secret}`;
        const tokenRes = await axios.get(tokenUrl);

        // 重点：检查返回的数据结构
        if (tokenRes.data.errcode !== 0 || !tokenRes.data.access_token) {
            console.error('❌ 企业微信 Token 获取失败:', JSON.stringify(tokenRes.data));
            return; // 终止执行
        }

        const accessToken = tokenRes.data.access_token;
        console.log('✅ Token 获取成功，准备发送消息...');

        // 2. 发送应用消息
        const sendUrl = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`;
        const postData = {
            touser: "@all", 
            msgtype: "textcard",
            agentid: parseInt(CONFIG.WEWORK_AGENTID), // 确保 AgentID 是数字
            textcard: {
                title: title,
                description: `💰 当前价格：${price}\n📈 今日涨幅：${changeRate}%\n🔥 今日最高：${high}\n⏰ 更新时间：${time}`,
                url: "https://work.weixin.qq.com/", 
                btntxt: "查看详情"
            }
        };

        const sendRes = await axios.post(sendUrl, postData);
        
        if (sendRes.data.errcode === 0) {
            console.log('✅ 企业微信消息推送成功');
        } else {
            console.error('❌ 消息推送失败，错误详情:', JSON.stringify(sendRes.data));
        }
    } catch (e) {
        console.error('❌ 企业微信函数执行异常:', e.message);
    }
}

/**
 * 邮件推送函数
 */
async function sendEmail(title, price, changeRate, high, time) {
    const transporter = nodemailer.createTransport({
        service: 'qq', // 若使用网易邮箱请改为 '163'
        auth: {
            user: CONFIG.MAIL_USER,
            pass: CONFIG.MAIL_PASS
        }
    });

    const htmlContent = `
        <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px;">
            <h2 style="color: #d4a017;">${title}</h2>
            <p><b>当前价格：</b>${price}</p>
            <p><b>今日涨幅：</b><span style="color:red">${changeRate}%</span></p>
            <p><b>今日最高：</b>${high}</p>
            <p><b>更新时间：</b>${time}</p>
            <hr>
            <p style="font-size: 12px; color: #999;">此邮件由 GitHub Actions 自动发出</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"金价助手" <${CONFIG.MAIL_USER}>`,
            to: CONFIG.MAIL_TO,
            subject: title,
            html: htmlContent
        });
        console.log('✅ 邮件发送成功');
    } catch (e) {
        console.error('❌ 邮件发送失败:', e.message);
    }
}

/**
 * 主程序
 */
async function main() {
    console.log('🚀 开始执行金价监控...');
    
    try {
        // 1. 调用接口获取数据
        const res = await axios.get(CONFIG.API_URL, {
            headers: { 'Authorization': `APPCODE ${CONFIG.APP_CODE}` }
        });

        if (res.data.code !== 1) {
            throw new Error(`接口返回异常: ${res.data.msg}`);
        }

        const goldData = res.data.data;
        const name = goldData.name;
        const price = goldData.price;
        const changeRate = goldData.changeRate;
        const high = goldData.high;
        const updateTime = new Date(goldData.update_time * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

        console.log(`[${updateTime}] ${name}: 当前价 ${price}, 涨幅 ${changeRate}%`);

        // 2. 策略判断
        if (price >= CONFIG.TARGET_PRICE || changeRate >= CONFIG.TARGET_CHG_RATE) {
            console.log('🎯 触发提醒阈值，准备发送通知...');
            const title = `⚠️ 金价预警：${name} 突破阈值！`;
            
            await Promise.all([
                pushWeWork(title, price, changeRate, high, updateTime),
                sendEmail(title, price, changeRate, high, updateTime)
            ]);
        } else {
            console.log('😴 波动较小，未达到提醒标准。');
        }
    } catch (e) {
        console.error('❌ 程序运行出错:', e.message);
    }
}

main();
