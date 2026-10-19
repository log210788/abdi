/* ==========================================================================
   Teacher Lewis's Homework Book — Preply Homework Submission & Auto-Save Engine
   homework_preply.js (Exercises 1.1 to 5.4)
   ========================================================================== */

(function (window, document) {
  'use strict';

  const STORAGE_KEY_ANSWERS = 'ghibli_hw_1_1_to_5_4_answers_v1';
  const STORAGE_KEY_NAME = 'ghibli_hw_student_name_v1';
  const STORAGE_KEY_NOTE = 'ghibli_hw_student_note_v1';

  // Exercise 1.2 Full Audio Playlist in Textbook Speaking Order (1 to 6)
  const EX1_2_PLAYLIST = [
    { order: 1, name: 'Rachel', file: 'audio/1/1_2_1.mp3', text: "Number 1. Hi, I'm Rachel." },
    { order: 2, name: 'Carl',   file: 'audio/1/1_2_4.mp3', text: "Number 2. My name's Carl." },
    { order: 3, name: 'Peter',  file: 'audio/1/1_2_2.mp3', text: "Number 3. Hello, my name's Peter." },
    { order: 4, name: 'Simone', file: 'audio/1/1_2_6.mp3', text: "Number 4. Hi, my name's Simone." },
    { order: 5, name: 'Terry',  file: 'audio/1/1_2_5.mp3', text: "Number 5. Hello, I'm Terry." },
    { order: 6, name: 'Jo',     file: 'audio/1/1_2_3.mp3', text: "Number 6. Hi, I'm Jo." }
  ];

  let isPlayingEx12 = false;
  let ex12Index = 0;

  function expandContractions(str) {
    if (!str) return '';
    return str.toString().toLowerCase()
      .replace(/\bisn['’]?t\b/g, 'is not')
      .replace(/\baren['’]?t\b/g, 'are not')
      .replace(/\bwasn['’]?t\b/g, 'was not')
      .replace(/\bweren['’]?t\b/g, 'were not')
      .replace(/\bdon['’]?t\b/g, 'do not')
      .replace(/\bdoesn['’]?t\b/g, 'does not')
      .replace(/\bdidn['’]?t\b/g, 'did not')
      .replace(/\bcan['’]?t\b/g, 'cannot')
      .replace(/\bcannot\b/g, 'can not')
      .replace(/\bwon['’]?t\b/g, 'will not')
      .replace(/\bi['’]?m\b/g, 'i am')
      .replace(/\byou['’]?re\b/g, 'you are')
      .replace(/\bhe['’]?s\b/g, 'he is')
      .replace(/\bshe['’]?s\b/g, 'she is')
      .replace(/\bit['’]?s\b/g, 'it is')
      .replace(/\bwe['’]?re\b/g, 'we are')
      .replace(/\bthey['’]?re\b/g, 'they are')
      .replace(/\bthere['’]?s\b/g, 'there is');
  }

  function normalizeAnswer(str) {
    if (!str) return '';
    return expandContractions(str)
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isAnswerCorrect(userValRaw, correctAttr) {
    const userVal = normalizeAnswer(userValRaw);
    if (!userVal) return false;
    const accepted = (correctAttr || '').split('|').map(normalizeAnswer).filter(Boolean);
    return accepted.includes(userVal);
  }

  function getAllGradableTextInputs() {
    const all = Array.from(document.querySelectorAll('input.ghibli-input[data-correct], input.ex1-1-input[data-correct]'));
    return all.filter(input => {
      if (input.closest('.ghibli-ordering-container, .ghibli-connecting-container')) return false;
      if (input.classList.contains('ghibli-connecting-input') || input.classList.contains('example-input')) return false;
      if (input.hasAttribute('readonly')) return false;
      return true;
    });
  }

  function getAllOrderingContainers() {
    return Array.from(document.querySelectorAll('.ghibli-ordering-container'));
  }

  function saveHomeworkState() {
    try {
      const inputs = getAllGradableTextInputs();
      const inputValues = inputs.map(inp => inp.value || '');

      const orderContainers = getAllOrderingContainers();
      const orderStates = orderContainers.map(container => {
        const dropSlot = container.querySelector('.ghibli-drop-slot');
        if (!dropSlot) return [];
        return Array.from(dropSlot.querySelectorAll('.word-chip')).map(c => c.getAttribute('data-word') || c.innerText.trim());
      });

      const payload = {
        updatedAt: new Date().toISOString(),
        inputs: inputValues,
        orders: orderStates
      };
      localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(payload));
      updateProgressIndicator();
    } catch (e) {
      console.warn('Could not save homework state:', e);
    }
  }

  function restoreHomeworkState() {
    try {
      const savedName = localStorage.getItem(STORAGE_KEY_NAME) || localStorage.getItem('ghibli_student_name') || '';
      const savedNote = localStorage.getItem(STORAGE_KEY_NOTE) || '';
      const topName = document.getElementById('hwStudentNameTop');
      const botName = document.getElementById('hwStudentNameBottom');
      const noteInput = document.getElementById('hwStudentNote');

      if (savedName && savedName !== 'Guest') {
        if (topName) topName.value = savedName;
        if (botName) botName.value = savedName;
      }
      if (savedNote && noteInput) {
        noteInput.value = savedNote;
      }

      const raw = localStorage.getItem(STORAGE_KEY_ANSWERS);
      if (!raw) {
        updateProgressIndicator();
        return;
      }
      const data = JSON.parse(raw);

      if (Array.isArray(data.inputs)) {
        const inputs = getAllGradableTextInputs();
        inputs.forEach((inp, idx) => {
          if (typeof data.inputs[idx] === 'string' && data.inputs[idx] !== '') {
            inp.value = data.inputs[idx];
            inp.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
      }

      if (Array.isArray(data.orders)) {
        const orderContainers = getAllOrderingContainers();
        orderContainers.forEach((container, idx) => {
          const words = data.orders[idx];
          if (!Array.isArray(words) || words.length === 0) return;

          const wordPool = container.querySelector('.word-pool');
          const dropSlot = container.querySelector('.ghibli-drop-slot');
          const orderInput = container.querySelector('.order-input, .ghibli-input');
          if (!wordPool || !dropSlot) return;

          words.forEach(w => {
            const chip = Array.from(wordPool.querySelectorAll('.word-chip')).find(
              c => (c.getAttribute('data-word') || c.innerText.trim()) === w
            );
            if (chip) {
              dropSlot.appendChild(chip);
            }
          });

          const placedChips = Array.from(dropSlot.querySelectorAll('.word-chip'));
          if (orderInput) {
            orderInput.value = placedChips.map(c => c.innerText.trim()).join(' ');
          }
          const placeholder = dropSlot.querySelector('.drop-placeholder');
          if (placeholder) {
            placeholder.style.display = placedChips.length > 0 ? 'none' : 'flex';
          }
          if (placedChips.length > 0) {
            dropSlot.classList.add('has-chips');
          }
        });
      }

      updateProgressIndicator();
    } catch (e) {
      console.warn('Could not restore homework state:', e);
    }
  }

  function updateProgressIndicator() {
    const inputs = getAllGradableTextInputs();
    const orders = getAllOrderingContainers();
    const total = inputs.length + orders.length;

    let answered = 0;
    inputs.forEach(inp => {
      if (inp.value && inp.value.trim().length > 0) answered++;
    });
    orders.forEach(container => {
      const dropSlot = container.querySelector('.ghibli-drop-slot');
      const orderInput = container.querySelector('.order-input');
      const hasWords = (dropSlot && dropSlot.querySelectorAll('.word-chip').length > 0) || (orderInput && orderInput.value.trim().length > 0);
      if (hasWords) answered++;
    });

    const answeredEl = document.getElementById('hwAnsweredCountText');
    if (answeredEl) {
      answeredEl.textContent = `Answered: ${answered} / ${total}`;
    }
  }

  function getItemPromptLabel(el, idxInEx) {
    const card = el.closest('.ghibli-char-card, .animal-card, .tree-node, .ghibli-ordering-container');
    if (!card) return `Item ${idxInEx}`;

    // Family tree node (4.1)
    if (card.classList.contains('tree-node')) {
      const img = card.querySelector('img[alt]');
      if (img && img.alt) return `Family Tree (${img.alt})`;
    }

    // Animal card (4.2)
    if (card.classList.contains('animal-card')) {
      const img = card.querySelector('img[alt]');
      if (img && img.alt) return `Animal #${idxInEx} (${img.alt})`;
    }

    // Country flag card (2.1)
    const flagImg = card.querySelector('img.ghibli-flag-img');
    if (flagImg) {
      const numSpan = card.querySelector('.item-index');
      const numText = numSpan ? numSpan.textContent.trim() : `${idxInEx}.`;
      return `Flag ${numText}`;
    }

    // Inline sentence gap (e.g. 3.4, 5.3)
    const sentenceDiv = card.querySelector('.ghibli-sentence-text');
    if (sentenceDiv) {
      const clone = sentenceDiv.cloneNode(true);
      clone.querySelectorAll('input').forEach(inp => {
        const rep = document.createTextNode(`[${inp.value.trim() || '___'}]`);
        inp.replaceWith(rep);
      });
      return clone.textContent.replace(/\s+/g, ' ').trim();
    }

    // Standard prompt text (1.1, 1.2, 3.1, 3.2, 5.1, 5.2)
    const promptEl = card.querySelector('.ghibli-prompt-text');
    if (promptEl) {
      return (promptEl.getAttribute('data-orig-text') || promptEl.textContent || `Item ${idxInEx}`).replace(/\s+/g, ' ').trim();
    }

    return `Question ${idxInEx}`;
  }

  function collectHomeworkReportData() {
    const topName = document.getElementById('hwStudentNameTop');
    const botName = document.getElementById('hwStudentNameBottom');
    const noteEl = document.getElementById('hwStudentNote');

    const studentName = (botName?.value || topName?.value || '').trim() || 'Student';
    const studentNote = (noteEl?.value || '').trim();

    const sections = Array.from(document.querySelectorAll('main.ghibli-exercises-wrap section.ghibli-section'));
    const exerciseSummaries = [];
    let grandTotal = 0;
    let grandCorrect = 0;
    let grandAnswered = 0;

    // Count duplicate 2.1 sections as 2.1 (Page 14) and 2.1 (Page 15)
    let ex21Counter = 0;

    sections.forEach(sec => {
      const exNumEl = sec.querySelector('.ghibli-ex-num');
      let exNum = exNumEl ? exNumEl.textContent.trim() : '?';
      const exInstEl = sec.querySelector('.ghibli-ex-instruction');
      const exTitle = exInstEl ? exInstEl.textContent.trim() : '';

      if (exNum === '2.1') {
        ex21Counter++;
        exNum = ex21Counter === 1 ? '2.1 (p.14)' : '2.1 (p.15)';
      }

      // Skip pure speaking charts with 0 gradable inputs (like 3.3)
      const secInputs = Array.from(sec.querySelectorAll('input.ghibli-input[data-correct], input.ex1-1-input[data-correct]')).filter(inp => {
        if (inp.closest('.ghibli-ordering-container, .ghibli-connecting-container')) return false;
        if (inp.classList.contains('example-input') || inp.hasAttribute('readonly')) return false;
        return true;
      });
      const secOrders = Array.from(sec.querySelectorAll('.ghibli-ordering-container'));

      if (secInputs.length === 0 && secOrders.length === 0) {
        return;
      }

      const items = [];
      let exCorrect = 0;
      let exAnswered = 0;

      secInputs.forEach((inp, i) => {
        const userVal = (inp.value || '').trim();
        const correctAttr = inp.getAttribute('data-correct') || '';
        const primaryExpected = correctAttr.split('|')[0] || '';
        const correct = isAnswerCorrect(userVal, correctAttr);
        const isAns = userVal.length > 0;

        if (isAns) exAnswered++;
        if (correct) exCorrect++;

        items.push({
          index: i + 1,
          prompt: getItemPromptLabel(inp, i + 1),
          userAnswer: userVal,
          expected: primaryExpected,
          isCorrect: correct,
          isAnswered: isAns
        });
      });

      secOrders.forEach((container, i) => {
        const dropSlot = container.querySelector('.ghibli-drop-slot');
        const orderInput = container.querySelector('.order-input, .ghibli-input');
        const correctAttr = container.getAttribute('data-correct') || (orderInput ? orderInput.getAttribute('data-correct') : '');
        const primaryExpected = correctAttr.split('|')[0] || '';

        let userSentence = '';
        if (dropSlot && dropSlot.querySelectorAll('.word-chip').length > 0) {
          userSentence = Array.from(dropSlot.querySelectorAll('.word-chip')).map(c => c.innerText.trim()).join(' ');
        } else if (orderInput) {
          userSentence = (orderInput.value || '').trim();
        }

        const correct = isAnswerCorrect(userSentence, correctAttr);
        const isAns = userSentence.length > 0;

        if (isAns) exAnswered++;
        if (correct) exCorrect++;

        items.push({
          index: i + 1,
          prompt: `Sentence #${i + 1}`,
          userAnswer: userSentence,
          expected: primaryExpected,
          isCorrect: correct,
          isAnswered: isAns
        });
      });

      const exTotal = items.length;
      grandTotal += exTotal;
      grandCorrect += exCorrect;
      grandAnswered += exAnswered;

      exerciseSummaries.push({
        exNum,
        exTitle,
        total: exTotal,
        correct: exCorrect,
        answered: exAnswered,
        items
      });
    });

    const pct = grandTotal > 0 ? Math.round((grandCorrect / grandTotal) * 100) : 0;

    return {
      studentName,
      studentNote,
      completedAt: new Date().toLocaleString(),
      grandTotal,
      grandCorrect,
      grandAnswered,
      percentage: pct,
      exercises: exerciseSummaries
    };
  }

  function formatPreplyTextReport(report, includeAllItems = true) {
    const lines = [];
    lines.push('🌿 TEACHER LEWIS HOMEWORK REPORT (Unit 1: Ex 1.1 – 5.4)');
    lines.push('====================================================');
    lines.push(`👤 Student: ${report.studentName}`);
    lines.push(`📅 Date: ${report.completedAt}`);
    lines.push(`⭐ Total Score: ${report.grandCorrect} / ${report.grandTotal} (${report.percentage}%)`);
    lines.push(`✍️ Answered: ${report.grandAnswered} / ${report.grandTotal} questions`);
    if (report.studentNote) {
      lines.push(`💬 Student Note: "${report.studentNote}"`);
    }
    lines.push('');
    lines.push('📊 SCORE BY EXERCISE:');
    report.exercises.forEach(ex => {
      const icon = ex.correct === ex.total ? '✅' : (ex.answered > 0 ? '📝' : '⚪');
      lines.push(`  ${icon} Ex ${ex.exNum}: ${ex.correct} / ${ex.total}`);
    });

    // List any incorrect or unanswered items first so Teacher Lewis sees them immediately
    const reviewItems = [];
    report.exercises.forEach(ex => {
      ex.items.forEach(it => {
        if (!it.isCorrect) {
          reviewItems.push({ exNum: ex.exNum, ...it });
        }
      });
    });

    lines.push('');
    if (reviewItems.length === 0) {
      lines.push('🎉 PERFECT SCORE! All 137 answers in Exercises 1.1 – 5.4 are 100% correct!');
    } else {
      lines.push(`🔍 ITEMS TO REVIEW IN CLASS (${reviewItems.length}):`);
      reviewItems.forEach(item => {
        const studentWrote = item.isAnswered ? `"${item.userAnswer}"` : '[Blank]';
        lines.push(`  ❌ [Ex ${item.exNum} #${item.index}] Wrote: ${studentWrote}  --> Correct: "${item.expected}"`);
      });
    }

    if (includeAllItems) {
      lines.push('');
      lines.push('----------------------------------------------------');
      lines.push('📋 COMPLETE ANSWER LOG (EXERCISES 1.1 – 5.4):');
      report.exercises.forEach(ex => {
        lines.push(`\n[Exercise ${ex.exNum} — ${ex.correct}/${ex.total}]`);
        ex.items.forEach(it => {
          const mark = it.isCorrect ? '✅' : (it.isAnswered ? '❌' : '⚪');
          const ansText = it.isAnswered ? it.userAnswer : '(blank)';
          const corrNote = it.isCorrect ? '' : ` [Expected: ${it.expected}]`;
          lines.push(`  ${mark} #${it.index}: ${ansText}${corrNote}`);
        });
      });
    }

    return lines.join('\n');
  }

  function renderHomeworkSummaryUI() {
    const report = collectHomeworkReportData();

    // Update breakdown chips
    const grid = document.getElementById('hwBreakdownGrid');
    if (grid) {
      grid.innerHTML = report.exercises.map(ex => {
        const isPerfect = ex.correct === ex.total;
        const isPartial = !isPerfect && ex.answered > 0;
        const cls = isPerfect ? 'perfect' : (isPartial ? 'partial' : '');
        const icon = isPerfect ? '✅' : (isPartial ? '📝' : '⚪');
        return `<div class="hw-ex-chip ${cls}">
          <span>Ex ${ex.exNum}</span>
          <span>${icon} ${ex.correct}/${ex.total}</span>
        </div>`;
      }).join('');
    }

    // Update preview textarea
    const textarea = document.getElementById('preplyReportTextarea');
    if (textarea) {
      textarea.value = formatPreplyTextReport(report, true);
    }

    updateProgressIndicator();
    return report;
  }

  function generateAndDownloadReportCardPNG() {
    if (window.GhibliEngine && typeof window.GhibliEngine.checkAnswers === 'function') {
      window.GhibliEngine.checkAnswers();
    }
    const report = renderHomeworkSummaryUI();

    const reviewItems = [];
    report.exercises.forEach(ex => {
      ex.items.forEach(it => {
        if (!it.isCorrect) {
          reviewItems.push({ exNum: ex.exNum, ...it });
        }
      });
    });

    const maxReviewShown = Math.min(reviewItems.length, 16);
    const reviewHeight = maxReviewShown > 0 ? (60 + maxReviewShown * 28) : 70;
    const noteHeight = report.studentNote ? 56 : 0;

    const canvas = document.createElement('canvas');
    const width = 1000;
    const height = 560 + noteHeight + reviewHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Background Parchment Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#fdfbf4');
    bgGrad.addColorStop(1, '#f3ede0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Outer Forest Border
    ctx.strokeStyle = '#2d5a27';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // Inner Gold Accent Border
    ctx.strokeStyle = '#e5a93c';
    ctx.lineWidth = 2;
    ctx.strokeRect(26, 26, width - 52, height - 52);

    // Header Banner
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(40, 40, width - 80, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Outfit, Inter, sans-serif';
    ctx.fillText("🌿 Teacher Lewis's Practice Book — Homework Report Card", 64, 84);

    ctx.fillStyle = '#d9f2d5';
    ctx.font = '600 18px Inter, sans-serif';
    ctx.fillText('Unit 1 Bite-Size Homework • Exercises 1.1 to 5.4 (Submitted via Preply)', 64, 122);

    // Student Info & Score Box Row
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d4c5a9';
    ctx.lineWidth = 2;
    ctx.fillRect(40, 170, 580, 110);
    ctx.strokeRect(40, 170, 580, 110);

    ctx.fillStyle = '#2b261f';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText(`Student: ${report.studentName}`, 60, 212);

    ctx.fillStyle = '#555555';
    ctx.font = '600 16px Inter, sans-serif';
    ctx.fillText(`Completed: ${report.completedAt}`, 60, 244);
    ctx.fillText(`Questions Answered: ${report.grandAnswered} / ${report.grandTotal}`, 60, 268);

    // Big Score Card on Right
    ctx.fillStyle = report.percentage >= 80 ? '#dcfce7' : '#fef3c7';
    ctx.strokeStyle = report.percentage >= 80 ? '#22c55e' : '#f59e0b';
    ctx.lineWidth = 3;
    ctx.fillRect(640, 170, 320, 110);
    ctx.strokeRect(640, 170, 320, 110);

    ctx.fillStyle = report.percentage >= 80 ? '#166534' : '#92400e';
    ctx.font = 'bold 36px Outfit, Inter, sans-serif';
    ctx.fillText(`${report.grandCorrect} / ${report.grandTotal} (${report.percentage}%)`, 665, 225);

    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('OVERALL HOMEWORK SCORE', 665, 258);

    let yCursor = 305;

    // Optional Student Note
    if (report.studentNote) {
      ctx.fillStyle = '#fffbeb';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.fillRect(40, yCursor, width - 80, 44);
      ctx.strokeRect(40, yCursor, width - 80, 44);

      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 15px Inter, sans-serif';
      const truncatedNote = report.studentNote.length > 95 ? report.studentNote.slice(0, 92) + '...' : report.studentNote;
      ctx.fillText(`💬 Student Note: "${truncatedNote}"`, 56, yCursor + 27);
      yCursor += 60;
    }

    // Exercise Breakdown Section Title
    ctx.fillStyle = '#2d5a27';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText('SCORE BREAKDOWN BY EXERCISE (1.1 – 5.4):', 40, yCursor + 16);
    yCursor += 30;

    // Draw 14 Exercise Chips in a 4-column grid
    const cols = 4;
    const cellW = (width - 80 - (cols - 1) * 14) / cols;
    const cellH = 44;

    report.exercises.forEach((ex, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = 40 + col * (cellW + 14);
      const y = yCursor + row * (cellH + 10);

      const isPerfect = ex.correct === ex.total;
      ctx.fillStyle = isPerfect ? '#dcfce7' : (ex.answered > 0 ? '#fef3c7' : '#f1f5f9');
      ctx.strokeStyle = isPerfect ? '#22c55e' : (ex.answered > 0 ? '#f59e0b' : '#cbd5e1');
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, cellW, cellH);
      ctx.strokeRect(x, y, cellW, cellH);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15px Inter, sans-serif';
      const statusMark = isPerfect ? '✓' : (ex.answered > 0 ? '•' : '○');
      ctx.fillText(`${statusMark} Ex ${ex.exNum}:  ${ex.correct} / ${ex.total}`, x + 14, y + 27);
    });

    const gridRows = Math.ceil(report.exercises.length / cols);
    yCursor += gridRows * (cellH + 10) + 20;

    // Review Items Section
    ctx.fillStyle = '#2d5a27';
    ctx.font = 'bold 19px Inter, sans-serif';
    if (reviewItems.length === 0) {
      ctx.fillStyle = '#dcfce7';
      ctx.fillRect(40, yCursor, width - 80, 50);
      ctx.fillStyle = '#166534';
      ctx.fillText('🎉 Magnificent! All 137 questions in Exercises 1.1 to 5.4 were answered 100% correctly!', 60, yCursor + 31);
    } else {
      ctx.fillText(`ITEMS TO REVIEW WITH TEACHER LEWIS (${reviewItems.length} total):`, 40, yCursor + 18);
      yCursor += 30;

      reviewItems.slice(0, maxReviewShown).forEach((item, i) => {
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#f8fafc';
        ctx.fillRect(40, yCursor, width - 80, 26);

        ctx.fillStyle = '#991b1b';
        ctx.font = '600 14px Consolas, monospace';
        const wroteStr = item.isAnswered ? `"${item.userAnswer}"` : '[Blank]';
        const lineStr = `[Ex ${item.exNum} #${item.index}] Student wrote: ${wroteStr}   ->   Target: "${item.expected}"`;
        ctx.fillText(lineStr.slice(0, 105), 52, yCursor + 18);
        yCursor += 28;
      });
    }

    // Download PNG
    const safeName = report.studentName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Student';
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Homework_1.1-5.4_${safeName}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showPreplyToast('🖼️ Downloaded Homework Report Card (.PNG)! Attach it in your Preply chat with Teacher Lewis using the 📎 icon!');
  }

  function downloadTxtReport() {
    if (window.GhibliEngine && typeof window.GhibliEngine.checkAnswers === 'function') {
      window.GhibliEngine.checkAnswers();
    }
    const report = renderHomeworkSummaryUI();
    const text = formatPreplyTextReport(report, true);
    const safeName = report.studentName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Student';

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Homework_1.1-5.4_${safeName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    showPreplyToast('📄 Downloaded Full Homework Answer Sheet (.TXT)! You can attach this file in your Preply chat with Teacher Lewis!');
  }

  async function copyReportToClipboard() {
    if (window.GhibliEngine && typeof window.GhibliEngine.checkAnswers === 'function') {
      window.GhibliEngine.checkAnswers();
    }
    const report = renderHomeworkSummaryUI();
    const text = formatPreplyTextReport(report, true);
    const textarea = document.getElementById('preplyReportTextarea');
    if (textarea) {
      textarea.value = text;
    }

    let copied = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch (e) {
        copied = false;
      }
    }

    if (!copied && textarea) {
      textarea.focus();
      textarea.select();
      try {
        copied = document.execCommand('copy');
      } catch (e) {}
    }

    if (window.GhibliAudio && typeof window.GhibliAudio.playChime === 'function') {
      window.GhibliAudio.playChime();
    }

    const copyBtn = document.getElementById('copyPreplyReportBtn');
    if (copyBtn) {
      const origHtml = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> ✅ Copied! Now Paste (Ctrl+V) in Preply Chat!';
      setTimeout(() => {
        copyBtn.innerHTML = origHtml;
      }, 4500);
    }

    showPreplyToast('✅ Homework Report copied to your clipboard! Now open Preply Messages with Teacher Lewis and Paste (Ctrl+V or Cmd+V)!');
    if (window.GhibliEngine && typeof window.GhibliEngine.speakMascot === 'function') {
      window.GhibliEngine.speakMascot('Homework copied! 🌿 Open your Preply chat with Teacher Lewis and paste it (Ctrl+V)!', 5500);
    }
  }

  function showPreplyToast(message) {
    const toast = document.getElementById('preplyStatusToast');
    const toastText = document.getElementById('preplyStatusToastText');
    if (toast && toastText) {
      toastText.textContent = message;
      toast.classList.add('show');
    }
  }

  function setupEx12FullAudioButton() {
    const btn = document.getElementById('playFullEx1_2Btn');
    if (!btn) return;

    const playNext = () => {
      if (!isPlayingEx12 || ex12Index >= EX1_2_PLAYLIST.length) {
        isPlayingEx12 = false;
        btn.innerHTML = '<i class="fa-solid fa-headphones"></i> Play All 6 Speakers in Order';
        return;
      }
      const item = EX1_2_PLAYLIST[ex12Index++];
      btn.innerHTML = `<i class="fa-solid fa-volume-high fa-beat"></i> Playing #${item.order}: ${item.name}... (Click to Stop)`;

      if (window.GhibliEngine && typeof window.GhibliEngine.playAudioTrack === 'function') {
        const audio = new Audio(item.file);
        window.GhibliEngine.activeAudio = audio;
        audio.onended = () => {
          setTimeout(playNext, 650);
        };
        audio.onerror = () => {
          setTimeout(playNext, 650);
        };
        audio.play().catch(() => {
          setTimeout(playNext, 650);
        });
      }
    };

    btn.addEventListener('click', () => {
      if (isPlayingEx12) {
        isPlayingEx12 = false;
        if (window.GhibliEngine && window.GhibliEngine.activeAudio) {
          window.GhibliEngine.activeAudio.pause();
        }
        btn.innerHTML = '<i class="fa-solid fa-headphones"></i> Play All 6 Speakers in Order';
        return;
      }
      isPlayingEx12 = true;
      ex12Index = 0;
      playNext();
    });
  }

  function initHomeworkPreply() {
    // Store original prompt text before mirroring mutates DOM
    document.querySelectorAll('.ghibli-prompt-text').forEach(el => {
      if (!el.getAttribute('data-orig-text')) {
        el.setAttribute('data-orig-text', el.textContent.replace(/\s+/g, ' ').trim());
      }
    });

    // Restore saved student name, note, and answers
    restoreHomeworkState();
    renderHomeworkSummaryUI();

    // Sync Top & Bottom student name inputs
    const topName = document.getElementById('hwStudentNameTop');
    const botName = document.getElementById('hwStudentNameBottom');
    const noteInput = document.getElementById('hwStudentNote');

    const syncNames = (val) => {
      if (topName && topName.value !== val) topName.value = val;
      if (botName && botName.value !== val) botName.value = val;
      try {
        localStorage.setItem(STORAGE_KEY_NAME, val);
      } catch (e) {}
      renderHomeworkSummaryUI();
    };

    if (topName) {
      topName.addEventListener('input', () => syncNames(topName.value));
    }
    if (botName) {
      botName.addEventListener('input', () => syncNames(botName.value));
    }
    if (noteInput) {
      noteInput.addEventListener('input', () => {
        try {
          localStorage.setItem(STORAGE_KEY_NOTE, noteInput.value);
        } catch (e) {}
        renderHomeworkSummaryUI();
      });
    }

    // Save state on any exercise input change or word-chip click/drop
    document.addEventListener('input', (e) => {
      if (e.target.closest('input.ghibli-input')) {
        saveHomeworkState();
        renderHomeworkSummaryUI();
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('.word-chip, .ghibli-order-reset-btn')) {
        setTimeout(() => {
          saveHomeworkState();
          renderHomeworkSummaryUI();
        }, 60);
      }
      if (e.target.closest('#ghibliCheckAnswersBtn, #ghibliFloatingCheckBtn')) {
        setTimeout(() => {
          renderHomeworkSummaryUI();
        }, 60);
      }
      if (e.target.closest('#ghibliResetBtn')) {
        setTimeout(() => {
          try {
            localStorage.removeItem(STORAGE_KEY_ANSWERS);
          } catch (err) {}
          renderHomeworkSummaryUI();
        }, 80);
      }
    });

    document.addEventListener('drop', () => {
      setTimeout(() => {
        saveHomeworkState();
        renderHomeworkSummaryUI();
      }, 60);
    });

    // Bind Preply Action Buttons
    const gradeBtn = document.getElementById('hwGradeAndBuildBtn');
    if (gradeBtn) {
      gradeBtn.addEventListener('click', () => {
        if (window.GhibliEngine && typeof window.GhibliEngine.checkAnswers === 'function') {
          window.GhibliEngine.checkAnswers();
        }
        renderHomeworkSummaryUI();
        showPreplyToast('⭐ Answers checked and Homework Report updated below! Choose Copy or Download to send to Teacher Lewis on Preply.');
      });
    }

    const copyBtn = document.getElementById('copyPreplyReportBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', copyReportToClipboard);
    }

    const imgBtn = document.getElementById('downloadReportImageBtn');
    if (imgBtn) {
      imgBtn.addEventListener('click', generateAndDownloadReportCardPNG);
    }

    const txtBtn = document.getElementById('downloadReportTxtBtn');
    if (txtBtn) {
      txtBtn.addEventListener('click', downloadTxtReport);
    }

    setupEx12FullAudioButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeworkPreply);
  } else {
    setTimeout(initHomeworkPreply, 0);
  }
})(window, document);
