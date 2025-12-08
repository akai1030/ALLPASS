const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// 解析 JSON 請求
app.use(bodyParser.json());
// 設定靜態檔案資料夾 (讓 public 裡的 index.html 可以被看到)
app.use(express.static('public'));

// --- 輔助函式：產生 Email 內的勾選清單 HTML ---
function makeList(items) {
  if (!items || items.length === 0) return "<p>無資料</p>";
  let html = '<ul style="list-style:none; padding-left:0; margin: 5px 0;">';
  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    if (item.checked) {
      html += '<li style="color:#333;">☑ ' + item.text + '</li>';
    } else {
      html += '<li style="color:#D32F2F; font-weight:bold;">☐ (未完成) ' + item.text + '</li>';
    }
  }
  html += '</ul>';
  return html;
}

// --- API: 接收前端資料並寄信 ---
app.post('/api/send-report', async (req, res) => {
  const formData = req.body;
  const targetEmail = "taitung.youthvolunteer@gmail.com"; 
  const subject = "【ALL PASS 回報】" + formData.userEmail;

  // 1. 製作 Email 內容 HTML
  let body = "";
  body += "<h2 style='margin-bottom:5px;'>ALL PASS 自組團隊全能自檢系統 - 回報資料</h2>";
  body += "<p><strong>填表人信箱：</strong> " + formData.userEmail + "</p>";
  body += "<hr style='border: 1px solid #eee; margin: 15px 0;'>";

  // 01 申請時間
  body += "<h3 style='background:#eee; padding:5px;'>01 / 申請時間</h3>";
  body += "<p>活動首日： " + (formData.serviceDate || "<span style='color:red'>未填寫</span>") + "</p>";

  // Terms Check
  body += "<h3 style='background:#eee; padding:5px;'>01 / Terms Check (簡章規範)</h3>";
  body += makeList(formData.termsList);

  // 02 執行數據
  body += "<h3 style='background:#eee; padding:5px;'>02 / 執行數據</h3>";
  body += "<p>計畫類別： " + (formData.projectType === 'general' ? '一般型 (6人 / 12小時)' : '專案型 (10人 / 18小時)') + "</p>";
  body += "<p>人數 (預/實)： " + formData.planPeople + " / " + formData.actPeople + "</p>";
  body += "<p>時數 (預/實)： " + formData.planHours + " / " + formData.actHours + "</p>";
  body += "<p>受眾 (預/實)： " + formData.planBen + " / " + formData.actBen + "</p>";

  // 03 保險資訊
  body += "<h3 style='background:#eee; padding:5px;'>03 / 保險資訊</h3>";
  body += "<p>保險狀態： " + formData.insStatusText + "</p>";

  if (formData.dateMode === 'range') {
    body += "<p>活動日期： " + (formData.actStartDate || '未填') + " ~ " + (formData.actEndDate || '未填') + "</p>";
    body += "<p>投保日期： " + (formData.insStartDate || '未填') + " ~ " + (formData.insEndDate || '未填') + "</p>";
  } else {
    body += "<p>日期模式： 指定單日模式 (詳細日期請見系統畫面)</p>";
  }

  body += "<p>Logo 露出確認： " + (formData.logoCheck ? "☑ 是" : "<span style='color:red'>☐ 否 (未確認)</span>") + "</p>";

  // 04 領據確認
  body += "<h3 style='background:#eee; padding:5px;'>04 / 領據確認</h3>";
  body += "<p>領據類型： " + (formData.receiptType === 'personal' ? '個人領據' : '團體/學校領據') + "</p>";
  body += "<p>勾選狀態：</p>";
  body += makeList(formData.receiptList);
  body += "<br><br><p style='color:#888; font-size:12px; border-top:1px solid #ccc; padding-top:10px;'>本郵件由 Zeabur 系統自動發送。</p>";

  // 2. 設定 Nodemailer (讀取環境變數)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS  
    }
  });

  const mailOptions = {
    from: `"ALL PASS 系統" <${process.env.EMAIL_USER}>`,
    to: targetEmail,
    replyTo: formData.userEmail,
    subject: subject,
    html: body
  };

  // 3. 執行寄信
  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    res.json({ status: 'SUCCESS' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// 啟動伺服器
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});