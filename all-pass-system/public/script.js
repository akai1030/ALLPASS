// --- UI 互動邏輯 ---
  
function switchMode(mode) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('mode-apply').classList.add('hidden');
    document.getElementById('mode-close').classList.add('hidden');
    document.getElementById('mode-info').classList.add('hidden');
    
    if(mode === 'apply') {
      document.querySelector('.nav-item:nth-child(1)').classList.add('active');
      document.getElementById('mode-apply').classList.remove('hidden');
      checkPlanQuality(); // 切換過來時也要執行檢查
    } else if(mode === 'close') {
      document.querySelector('.nav-item:nth-child(2)').classList.add('active');
      document.getElementById('mode-close').classList.remove('hidden');
      // 初始化所有檢查
      checkTerms();
      checkData();
      checkInsurance();
    } else if(mode === 'info') {
      document.querySelector('.nav-item:nth-child(3)').classList.add('active');
      document.getElementById('mode-info').classList.remove('hidden');
    }
  }

  function toggleCheck(div) {
    const input = div.querySelector('input');
    input.checked = !input.checked;
    if(input.checked) div.classList.add('checked');
    else div.classList.remove('checked');
    input.dispatchEvent(new Event('change'));
  }

  function setValidator(id, status, title, lines) {
    const box = document.getElementById(id);
    box.className = 'validator-box ' + status; // pass, fail, warn
    box.classList.remove('hidden');
    box.querySelector('.v-status').innerText = title;
    
    let html = '';
    lines.forEach(l => html += `<span>${l}</span>`);
    box.querySelector('.v-msg').innerHTML = html;

    // --- 觸發小幫手反應 (Validation Hook) ---
    const helper = document.getElementById('pixel-helper');
    const bubble = document.getElementById('helper-bubble');
    
    // 移除舊狀態
    helper.classList.remove('helper-success', 'helper-error', 'helper-idle', 'helper-typing');

    if (status === 'pass') {
        helper.classList.add('helper-success');
        bubble.innerText = '太棒了！完美通過！✨';
    } else if (status === 'fail') {
        helper.classList.add('helper-error');
        bubble.innerText = '噢不...這裡有問題 🚨';
    } else if (status === 'warn') {
        // Warn 也可以當作一種 Error 提醒
        helper.classList.add('helper-error'); 
        bubble.innerText = '注意！這裡需要檢查 ⚠️';
    }
    
    // 3秒後恢復正常
    setTimeout(() => {
        helper.classList.remove('helper-success', 'helper-error');
    }, 3000);
  }

  // --- 業務邏輯 ---

  function checkApplication() {
    const dateInput = document.getElementById('applyServiceDate').value;
    if(!dateInput) return;
    
    const today = new Date(); today.setHours(0,0,0,0);
    const serviceDay = new Date(dateInput); serviceDay.setHours(0,0,0,0);
    const diffDays = Math.ceil((serviceDay - today) / (1000 * 60 * 60 * 24));
    
    if(diffDays >= 37) {
      setValidator('apply-validator', 'pass', 'APPROVED', [`距離活動 ${diffDays} 天`, `符合 37 天前規定`]);
    } else if(diffDays >= 30) {
      setValidator('apply-validator', 'warn', 'CONDITIONAL', [`剩 ${diffDays} 天`, `僅限「修正案件」送出`, `新案件將被退件`]);
    } else {
      setValidator('apply-validator', 'fail', 'REJECTED', [`剩 ${diffDays} 天`, `時間不足 (需30天以上)`]);
    }
  }

  // 計畫品質檢查邏輯
  function checkPlanQuality() {
      // 取得所有 plan-check 的 checkbox
      const checks = document.querySelectorAll('.plan-check');
      let score = 0;
      let basicCount = 0;
      let standardCount = 0;
      let bonusCount = 0;

      // 檢查狀態 (前3個是基礎, 中間3個是標準, 後3個是Bonus)
      checks.forEach((chk, index) => {
          if(chk.checked) {
              if(index < 3) basicCount++;
              else if(index < 6) standardCount++;
              else bonusCount++;
          }
      });

      const validatorId = 'plan-validator';
      let messages = [];
      let statusClass = '';
      let title = '';

      if (basicCount < 3) {
          // 基礎沒過
          statusClass = 'fail';
          title = 'CRITICAL MISSING';
          messages.push(`基礎門檻未達標 (${basicCount}/3)`);
          messages.push('⚠️ 請確認人數、年齡與保險費編列，否則將無法通過資格審查。');
      } else if (standardCount < 3) {
          // 標準沒過
          statusClass = 'warn';
          title = 'WEAK PROPOSAL';
          messages.push('基礎門檻已通過 ☑');
          messages.push(`評審標準尚缺 ${3-standardCount} 項`);
          messages.push('💡 建議加強需求調查或反思環節，以提高過件率。');
      } else {
          // 基礎+標準都過
          statusClass = 'pass';
          title = 'STRONG PROPOSAL';
          messages.push('基礎與評審標準皆完善 ☑');
          
          if (bonusCount > 0) {
             title = 'EXCELLENT (BONUS+)';
             messages.push(`✨ 觸發 ${bonusCount} 項加分條件！`);
             messages.push('有極高機率獲得高額獎金。');
          } else {
             messages.push('可嘗試勾選下方加分項以爭取更高獎金。');
          }
      }

      setValidator(validatorId, statusClass, title, messages);
  }

  function checkTerms() {
    const checked = document.querySelectorAll('.clause-check:checked').length;
    if(checked === 3) {
      setValidator('terms-validator', 'pass', 'TERMS ACCEPTED', ['已確認所有簡章規定']);
    } else {
      setValidator('terms-validator', 'fail', 'ACTION REQUIRED', [`尚有 ${3-checked} 項條款未確認`]);
    }
  }

  function checkData() {
    const type = document.getElementById('projectType').value;
    const pPeople = parseInt(document.getElementById('planPeople').value) || 0;
    const aPeople = parseInt(document.getElementById('actPeople').value) || 0;
    const pHours = parseInt(document.getElementById('planHours').value) || 0;
    const aHours = parseInt(document.getElementById('actHours').value) || 0;
    const pBen = parseInt(document.getElementById('planBen').value) || 0;
    const aBen = parseInt(document.getElementById('actBen').value) || 0;

    if(pPeople === 0 && aPeople === 0) {
       setValidator('data-validator', '', 'WAITING INPUT...', ['請輸入預定與實際數據']);
       return;
    }

    let errors = [];
    let warns = [];

    let minPeople = (type === 'project') ? 10 : 6;
    let minHours = (type === 'project') ? 18 : 12;

    if(aPeople < minPeople) errors.push(`人數不足 (標準 ${minPeople}人 / 實際 ${aPeople}人)`);
    if(aHours < minHours) errors.push(`時數不足 (標準 ${minHours}小時 / 實際 ${aHours}小時)`);

    let d_people = Math.ceil(pPeople * 2/3);
    let d_hours = Math.ceil(pHours * 2/3);
    let d_ben = Math.ceil(pBen * 2/3);
    
    if(pPeople > 0 && aPeople < d_people) warns.push(`人數未達原案 2/3 (目標 ${d_people})`);
    if(pHours > 0 && aHours < d_hours) warns.push(`時數未達原案 2/3 (目標 ${d_hours})`);
    if(pBen > 0 && aBen < d_ben) warns.push(`效益未達原案 2/3 (目標 ${d_ben})`);

    if(errors.length > 0) {
        setValidator('data-validator', 'fail', 'DATA FAILURE', errors);
    } else if (warns.length > 0) {
        warns.push("⚠️ 將扣減 1/3 獎金");
        setValidator('data-validator', 'warn', 'DEDUCTION WARNING', warns);
    } else {
        setValidator('data-validator', 'pass', 'DATA CLEARED', ['人數、時數、效益皆符合標準']);
    }
  }

  // --- 日期模式切換邏輯 ---
  let dateMode = 'range'; // 'range' or 'single'

  function toggleDateMode(mode) {
      dateMode = mode;
      document.querySelectorAll('.radio-btn').forEach(el => el.classList.remove('active'));
      document.getElementById('btn-' + mode).classList.add('active');

      if (mode === 'range') {
          document.getElementById('date-mode-range').classList.remove('hidden');
          document.getElementById('date-mode-single').classList.add('hidden');
      } else {
          document.getElementById('date-mode-range').classList.add('hidden');
          document.getElementById('date-mode-single').classList.remove('hidden');
          if(document.querySelectorAll('.single-date-row').length === 0) addDateRow(); // 預設加一列
      }
      checkInsurance();
  }

  function addDateRow() {
      const container = document.getElementById('single-dates-container');
      const div = document.createElement('div');
      div.className = 'single-date-row';
      div.innerHTML = `
          <div class="grid">
              <div>
                  <label>活動日期</label>
                  <input type="date" class="act-single-date" onchange="checkInsurance()">
              </div>
              <div>
                  <label>投保日期</label>
                  <input type="date" class="ins-single-date" onchange="checkInsurance()">
              </div>
          </div>
          <div class="btn-remove" onclick="removeDateRow(this)">
              <i class="ph-bold ph-trash"></i>
          </div>
      `;
      container.appendChild(div);
  }

  function removeDateRow(btn) {
      btn.parentElement.remove();
      checkInsurance();
  }

  // 4. 保險檢查
  function checkInsurance() {
    const status = document.getElementById('insuranceStatus').value;
    const logo = document.getElementById('checkLogo').checked;
    let errors = [];

    // A. 日期檢查
    let dateValid = true;

    if (dateMode === 'range') {
        const as = document.getElementById('actStartDate').value;
        const ae = document.getElementById('actEndDate').value;
        const is = document.getElementById('insStartDate').value;
        const ie = document.getElementById('insEndDate').value;

        if(!as || !ae || !is || !ie) {
            dateValid = false; 
        } else if(new Date(is) > new Date(as) || new Date(ie) < new Date(ae)) {
            errors.push("❌ 保險日期未完全包覆活動期間");
        }
    } else {
        // 單日模式
        const rows = document.querySelectorAll('.single-date-row');
        if (rows.length === 0) {
            errors.push("❌ 請至少新增一天活動日期");
        } else {
            rows.forEach((row, index) => {
                const act = row.querySelector('.act-single-date').value;
                const ins = row.querySelector('.ins-single-date').value;
                if (!act || !ins) {
                    dateValid = false;
                } else if (act !== ins) {
                    if (new Date(ins) > new Date(act)) {
                         errors.push(`❌ 第 ${index+1} 筆：投保日晚於活動日`);
                    }
                }
            });
        }
    }

    if (!dateValid && errors.length === 0) {
         setValidator('ins-validator', '', 'INCOMPLETE', ['請完整填寫所有日期欄位']);
         return;
    }

    // B. 狀態檢查
    if(status === 'none') errors.push("請選擇投保狀態");
    if(status === 'fail') errors.push("❌ 未投保/使用學保 (取消資格)");
    if(!logo) errors.push("❌ 未確認 Logo 露出");

    // C. 綜合輸出
    if(errors.length > 0) {
        setValidator('ins-validator', 'fail', 'INSURANCE ISSUE', errors);
    } else if (status === 'insufficient') {
        setValidator('ins-validator', 'warn', 'DEDUCTION WARNING', ['⚠️ 保額不足，將扣款 10%', '日期範圍符合規定', 'Logo 已露出']);
    } else {
        setValidator('ins-validator', 'pass', 'INSURANCE CLEARED', ['投保足額、日期正確、Logo 已露出']);
    }
  }

  // 5. 領據清單
  const receiptPersonalItems = [
    "系統上已填領款資料", 
    "基本資料無誤 (身分證/帳戶/戶籍)", 
    "正本親簽 (無鉛筆/擦擦筆)", 
    "無塗改，非得塗改有負責人簽章", 
    "帳戶為本人 (非社團)", 
    "已附存摺影本", 
    "指導老師代領需註明理由"
  ];
  const receiptOrgItems = [
    "系統領款資料無誤", "已註明計畫名稱", "無「補助/捐款」字樣"
  ];

  function toggleReceiptList() {
    const type = document.getElementById('receiptType').value;
    const container = document.getElementById('receipt-checklist');
    container.innerHTML = '';
    
    const items = (type === 'personal') ? receiptPersonalItems : receiptOrgItems;
    
    items.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'toggle-block';
      div.onclick = function() { toggleCheck(this); };
      div.innerHTML = `
        <div class="toggle-square"><i class="ph-bold ph-check"></i></div>
        <div class="toggle-text">${item}</div>
        <input type="checkbox" class="r-check hidden" onchange="checkReceipt()">
      `;
      container.appendChild(div);
    });
    checkReceipt();
  }

  function checkReceipt() {
    const total = document.querySelectorAll('.r-check').length;
    const checked = document.querySelectorAll('.r-check:checked').length;
    
    if(total > 0 && total === checked) {
        setValidator('receipt-validator', 'pass', 'RECEIPT CLEARED', ['領據檢核點全數通過']);
    } else {
        setValidator('receipt-validator', 'fail', 'INCOMPLETE', [`尚有 ${total-checked} 個檢核點未通過`]);
    }
  }

  // --- 送出資料邏輯 (Node.js Fetch 版) ---
  function submitToGmail() {
    // 檢查是否選擇了志工中心
    const centerEmail = document.getElementById('centerSelect').value;
    if(!centerEmail) {
      alert("請選擇所屬的青年志工中心！");
      document.getElementById('centerSelect').focus();
      return;
    }

    // 抓取團隊名稱與編號
    const teamName = document.getElementById('teamName').value;
    const teamId = document.getElementById('teamId').value;
    
    // 簡單檢查團隊名稱
    if(!teamName) {
      alert("請填寫團隊名稱！");
      document.getElementById('teamName').focus();
      return;
    }

    const email = document.getElementById('userEmail').value;
    
    // 簡單驗證 Email
    if(!email || !email.includes('@')) {
      alert("請填寫正確的 Email 格式！");
      document.getElementById('userEmail').focus();
      return;
    }

    // 鎖定按鈕
    const btn = document.getElementById('submitBtn');
    btn.style.pointerEvents = 'none';
    btn.innerHTML = '<i class="ph-bold ph-spinner"></i> 整理資料中...';
    
    // 觸發小幫手動畫 (Submit)
    const helper = document.getElementById('pixel-helper');
    helper.classList.add('helper-success'); // 用成功動畫代替發送中動畫
    document.getElementById('helper-bubble').innerText = '正在幫你光速寄信中...🚀';
    
    setValidator('submit-validator', 'warn', 'SENDING...', ['正在連線伺服器...']);

    // --- 1. 抓取 Terms Check ---
    const termsList = [];
    const termsContainer = document.querySelector('#mode-close .card[style*="alert"]'); 
    if(termsContainer) {
        termsContainer.querySelectorAll('.toggle-block').forEach(block => {
            const text = block.querySelector('.toggle-text').innerText;
            const checked = block.querySelector('input').checked;
            termsList.push({ text: text, checked: checked });
        });
    }

    // --- 2. 抓取 領據清單 ---
    const receiptList = [];
    const receiptContainer = document.getElementById('receipt-checklist');
    if(receiptContainer) {
        receiptContainer.querySelectorAll('.toggle-block').forEach(block => {
            const text = block.querySelector('.toggle-text').innerText;
            const checked = block.querySelector('input').checked;
            receiptList.push({ text: text, checked: checked });
        });
    }

    // --- 3. 處理保險狀態文字 ---
    const insSelect = document.getElementById('insuranceStatus');
    const insStatusText = insSelect.options[insSelect.selectedIndex].text;

    // 收集所有資料
    const formData = {
      targetCenterEmail: centerEmail, 
      teamName: teamName,  
      teamId: teamId,      
      userEmail: email,
      serviceDate: document.getElementById('applyServiceDate').value,
      
      termsList: termsList,

      projectType: document.getElementById('projectType').value,
      planPeople: document.getElementById('planPeople').value || 0,
      actPeople: document.getElementById('actPeople').value || 0,
      planHours: document.getElementById('planHours').value || 0,
      actHours: document.getElementById('actHours').value || 0,
      planBen: document.getElementById('planBen').value || 0,
      actBen: document.getElementById('actBen').value || 0,
      
      insStatusText: insStatusText, 
      dateMode: dateMode, 
      actStartDate: document.getElementById('actStartDate').value,
      actEndDate: document.getElementById('actEndDate').value,
      insStartDate: document.getElementById('insStartDate').value,
      insEndDate: document.getElementById('insEndDate').value,
      logoCheck: document.getElementById('checkLogo').checked,

      receiptType: document.getElementById('receiptType').value,
      receiptList: receiptList 
    };

    // --- 改用 Fetch 呼叫 Node.js 後端 ---
    fetch('/api/send-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      if(data.status === 'SUCCESS') {
        setValidator('submit-validator', 'pass', 'SENT SUCCESS', ['資料已回報至志工中心', '包含未通過之項目']);
        btn.innerHTML = '<i class="ph-bold ph-check"></i> 傳送完成';
      } else {
        throw new Error('Server returned error');
      }
    })
    .catch(error => {
      setValidator('submit-validator', 'fail', 'ERROR', ['傳送失敗', error.message]);
      btn.style.pointerEvents = 'auto';
      btn.innerHTML = '<i class="ph-bold ph-warning"></i> 重試';
    });
  }
  
  // ============================================
  //          PIXEL HELPER LOGIC (互動邏輯)
  // ============================================
  document.addEventListener('DOMContentLoaded', () => {
    const helper = document.getElementById('pixel-helper');
    const bubble = document.getElementById('helper-bubble');
    
    // 機器人的閒聊語錄
    const jokes = [
        "喵嗚～", 
        "今天天氣真好 ☀️", 
        "你的計畫寫得怎麼樣？", 
        "不要偷懶喔！盯著你～", 
        "Zzz... 😴",
        "我只是個 8-bit 生物，別太苛求我。",
        "記得核銷單據喔！",
        "保險買了嗎？喵？",
        "你知道為什麼電腦不吃飯嗎？因為它有 Bit！",
        "快點填完，我們去拯救世界！"
    ];

    let isLocked = false; // 是否鎖定在某個欄位上
    let idleTimer;
    let talkInterval;

    // 1. 聚焦跟隨邏輯 (Focus Follow)
    const targets = document.querySelectorAll('input, select, .toggle-block, .btn-add');
    const tips = {
        'applyServiceDate': '記得算好 37 天喔！📅',
        'projectType': '選你是哪一種類型 🤔',
        'planPeople': '預計會有多少人來？👥',
        'userEmail': '寄信給你用的，別填錯囉 📧',
        'btn-add': '點我新增一筆！➕',
        'teamName': '你們團隊叫什麼名字？📛',
        'teamId': '如果還沒拿到可以先不填 🆔',
        'centerSelect': '選你的管轄單位 🏢',
        'default': '這裡要注意喔 👈'
    };

    // 隨機說話功能
    function speakRandomly() {
        if (!isLocked && !helper.classList.contains('active')) {
            const randomMsg = jokes[Math.floor(Math.random() * jokes.length)];
            bubble.innerText = randomMsg;
            helper.classList.add('active'); // 顯示氣泡
            
            // 講完話 3 秒後消失
            setTimeout(() => {
                if (!isLocked) helper.classList.remove('active');
            }, 3000);
        }
    }

    // 滑鼠移動時跟隨
    document.addEventListener('mousemove', (e) => {
        resetIdleTimer();
        if (!isLocked) {
            // 跟隨滑鼠，稍微偏移一點
            helper.style.left = (e.clientX + 20) + 'px';
            helper.style.top = (e.clientY + 20) + 'px';
        }
    });

    targets.forEach(el => {
        // 移入欄位：鎖定位置
        el.addEventListener('mouseenter', (e) => {
            isLocked = true;
            resetIdleTimer();
            
            const rect = el.getBoundingClientRect();
            // 計算位置：放在欄位的「左側」
            const moveLeft = rect.left - 150; 
            const moveTop = rect.top + (rect.height / 2) - 30;

            helper.style.left = `${moveLeft}px`;
            helper.style.top = `${moveTop}px`;
            
            helper.classList.remove('hidden', 'helper-idle');
            helper.classList.add('active');

            const id = el.id || 'default';
            // 如果不是在報錯狀態，才更新文字
            if(!helper.classList.contains('helper-error') && !helper.classList.contains('helper-success')) {
                bubble.innerText = tips[id] || tips['default'];
            }
        });

        // 移出欄位：解除鎖定
        el.addEventListener('mouseleave', () => {
            isLocked = false;
            helper.classList.remove('active'); // 隱藏氣泡
        });
    });

    // 2. 打字互動邏輯 (Typing)
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            resetIdleTimer();
            helper.classList.add('helper-typing');
            bubble.innerText = '寫寫寫... ✍️';
            helper.classList.add('active');
            
            // 停止打字 0.5 秒後停止跳動
            clearTimeout(input.typingTimeout);
            input.typingTimeout = setTimeout(() => {
                helper.classList.remove('helper-typing');
                bubble.innerText = '寫好了嗎？';
            }, 500);
        });
    });

    // 3. 發呆偵測邏輯 (Idle)
    function resetIdleTimer() {
        clearTimeout(idleTimer);
        clearInterval(talkInterval); // 清除說話計時器
        
        helper.classList.remove('helper-idle');
        
        // 重新啟動閒聊計時器 (每 15 秒講一次話)
        talkInterval = setInterval(speakRandomly, 15000);

        // 10秒無動作進入休眠
        idleTimer = setTimeout(() => {
            helper.classList.add('helper-idle');
            bubble.innerText = 'Zzz... 😴';
            helper.classList.add('active');
        }, 10000);
    }

    // 初始化啟動偵測
    document.addEventListener('mousemove', resetIdleTimer);
    document.addEventListener('keydown', resetIdleTimer);
    resetIdleTimer();
  });

  // 初始化
  toggleReceiptList();
  if(!document.getElementById('mode-apply').classList.contains('hidden')){
      checkPlanQuality();
  }