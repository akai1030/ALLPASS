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

  // 新增：計畫品質檢查邏輯
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
  
  // 初始化
  toggleReceiptList();
  // 如果預設就在第一頁，初始化計畫檢查
  if(!document.getElementById('mode-apply').classList.contains('hidden')){
      checkPlanQuality();
  }