<script lang="ts">
  // ── Services & prices ─────────────────────────────────────────────────────
  const SERVICES = [
    { id: 'org',      label: 'Organization Tips',          price: 25,  icon: '🗂️', desc: 'Practical strategies to declutter and optimise your space.' },
    { id: 'color',    label: 'Color Palette Consultation', price: 35,  icon: '🎨', desc: 'Curated paint, fabric, and accent colors that work together.' },
    { id: 'lighting', label: 'Lighting Design',            price: 45,  icon: '💡', desc: 'Layered lighting plan for ambience, task, and accent lighting.' },
    { id: 'furnish',  label: 'Furnishing Design',          price: 50,  icon: '🛋️', desc: 'Furniture selection and layout tailored to your lifestyle.' },
    { id: 'mockup',   label: 'Full 3D Mock-up',            price: 75,  icon: '🏠', desc: 'Photorealistic 3D render so you can visualise the finished room.' },
  ] as const;

  type ServiceId = typeof SERVICES[number]['id'];


  // ── Web3Forms – get a free access key at web3forms.com (enter your email) ─
  const WEB3FORMS_KEY = 'YOUR_ACCESS_KEY';

  // ── Donate – replace with your real donate URL ────────────────────────────
  const DONATE_URL = 'https://buymeacoffee.com/YOUR_HANDLE';

  // ── Ad – replace with your real 30-sec ad URL (YouTube, etc.) ────────────
  const AD_URL = 'https://www.youtube.com/watch?v=YOUR_AD_ID';

  let adWatching = false;
  let adDone = false;
  let adSeconds = 30;
  let adTimer: ReturnType<typeof setInterval> | null = null;

  function startAd() {
    adWatching = true;
    adDone = false;
    adSeconds = 30;
    window.open(AD_URL, '_blank', 'noopener,noreferrer');
    adTimer = setInterval(() => {
      adSeconds -= 1;
      if (adSeconds <= 0) {
        clearInterval(adTimer!);
        adTimer = null;
        adWatching = false;
        adDone = true;
      }
    }, 1000);
  }

  // ── Modal state ───────────────────────────────────────────────────────────
  let open = false;
  let tab: 'quote' | 'feedback' | 'donate' = 'feedback';

  // ── Quote form state ──────────────────────────────────────────────────────
  let qShowForm = false;
  let qName  = '';
  let qEmail = '';
  let qDesc  = '';
  let qPhoto1: File | null = null;
  let qPhoto2: File | null = null;
  let qSelected = new Set<ServiceId>();
  let qBusy   = false;
  let qDone   = false;
  let qErr    = '';

  function toggleService(id: ServiceId) {
    if (qSelected.has(id)) qSelected.delete(id); else qSelected.add(id);
    qSelected = new Set(qSelected);
  }

  $: total = SERVICES.filter(s => qSelected.has(s.id)).reduce((sum, s) => sum + s.price, 0);
  $: descOk = qDesc.length >= 20;
  $: quoteOk = qName.trim() && qEmail.trim() && descOk && qPhoto1 && qPhoto2 && qSelected.size > 0;

  // ── Feedback form state ───────────────────────────────────────────────────
  let fType: 'feature' | 'bug' | 'compliment' | 'question' = 'question';
  let fSubject = '';
  let fDesc    = '';
  let fShot: File | null = null;
  let fBusy = false;
  let fDone = false;
  let fErr  = '';

  $: feedbackOk = fSubject.trim() && fDesc.trim();

  // ── Helpers ───────────────────────────────────────────────────────────────
  function closeModal() { open = false; }
  function onBackdrop(e: MouseEvent) { if (e.target === e.currentTarget) closeModal(); }
  function onKey(e: KeyboardEvent)   { if (e.key === 'Escape') closeModal(); }

  function pickFile(setter: (f: File) => void) {
    return (e: Event) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) setter(f);
    };
  }

  async function post(fd: FormData, subject: string): Promise<boolean> {
    fd.append('access_key', WEB3FORMS_KEY);
    fd.append('subject',    subject);
    const res  = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd });
    const json = await res.json();
    return json.success === true;
  }

  async function submitQuote() {
    if (!quoteOk) return;
    qBusy = true; qErr = '';
    const fd = new FormData();
    fd.append('name',        qName);
    fd.append('email',       qEmail);
    fd.append('description', qDesc);
    fd.append('services',    SERVICES.filter(s => qSelected.has(s.id)).map(s => `${s.label} ($${s.price})`).join(', '));
    fd.append('total',       `$${total}`);
    if (qPhoto1) fd.append('photo_angle_1', qPhoto1, qPhoto1.name);
    if (qPhoto2) fd.append('photo_angle_2', qPhoto2, qPhoto2.name);
    try   { qDone = await post(fd, 'New Quote Request'); if (!qDone) qErr = 'Submission failed — please try again.'; }
    catch { qErr = 'Network error — please check your connection.'; }
    finally { qBusy = false; }
  }

  async function submitFeedback() {
    if (!feedbackOk) return;
    fBusy = true; fErr = '';
    const typeLabel = fType === 'feature' ? 'Feature Request' : fType === 'bug' ? 'Bug Report' : fType === 'compliment' ? 'Friendly Compliment' : 'Question';
    const fd = new FormData();
    fd.append('type',        typeLabel);
    fd.append('description', fDesc);
    if (fShot) fd.append('screenshot', fShot, fShot.name);
    try   { fDone = await post(fd, `[${typeLabel}] ${fSubject}`); if (!fDone) fErr = 'Submission failed — please try again.'; }
    catch { fErr = 'Network error — please check your connection.'; }
    finally { fBusy = false; }
  }
</script>

<svelte:window on:keydown={onKey} />

<!-- ── Trigger button ─────────────────────────────────────────────────────── -->
<button class="help-btn" on:click={() => (open = true)} aria-label="Need Help?">
  Need Help?
</button>

<!-- ── Modal ─────────────────────────────────────────────────────────────── -->
{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="backdrop" on:click={onBackdrop}>
    <div class="modal" role="dialog" aria-modal="true" aria-label="Help">

      <!-- Header -->
      <div class="modal-header">
        <div class="tabs">
          <button class:active={tab === 'feedback'} on:click={() => (tab = 'feedback')}>Feedback</button>
          <button class:active={tab === 'quote'}    on:click={() => (tab = 'quote')}>Quote Request</button>
          <button class:active={tab === 'donate'}   on:click={() => (tab = 'donate')}>Donate</button>
        </div>
        <button class="close" on:click={closeModal} aria-label="Close">✕</button>
      </div>

      <!-- ── Tab 1: Quote ─────────────────────────────────────────────────── -->
      {#if tab === 'quote'}
        <div class="body">
          {#if qDone}
            <div class="success">
              <div class="success-icon">✓</div>
              <p class="success-title">Request sent!</p>
              <p class="success-sub">We'll be in touch within 24 hours!</p>
            </div>

          {:else if !qShowForm}
            <!-- Pricing overview -->
            <p class="blurb">Everything we offer — pick what you need and we'll put together a quote.</p>
            <div class="pricing-list">
              {#each SERVICES as svc}
                <div class="pricing-card">
                  <span class="svc-icon">{svc.icon}</span>
                  <div class="svc-info">
                    <span class="svc-name">{svc.label}</span>
                    <span class="svc-desc">{svc.desc}</span>
                  </div>
                  <span class="svc-price">${svc.price}</span>
                </div>
              {/each}
            </div>
            <button class="submit" on:click={() => (qShowForm = true)}>
              Get Started →
            </button>

          {:else}
            <!-- Quote form -->
            <button class="back-btn" on:click={() => (qShowForm = false)}>← Back to services</button>

            <label for="q-name">Name <span class="req">*</span></label>
            <input id="q-name" type="text" bind:value={qName} placeholder="Jane Smith" autocomplete="name">

            <label for="q-email">Email <span class="req">*</span></label>
            <input id="q-email" type="email" bind:value={qEmail} placeholder="jane@example.com" autocomplete="email">

            <label for="q-desc">
              Design challenge <span class="req">*</span>
              <span class="char-hint" class:ok={descOk}>{qDesc.length}/20 min</span>
            </label>
            <textarea
              id="q-desc"
              bind:value={qDesc}
              rows="3"
              placeholder="Tell us what you're struggling with — the more detail the better!"
            ></textarea>

            <div class="upload-row">
              <div class="upload-cell">
                <label>Room photo – Angle 1 <span class="req">*</span></label>
                <label class="file-btn" class:has-file={!!qPhoto1}>
                  {qPhoto1 ? qPhoto1.name : '📷 Choose image'}
                  <input type="file" accept="image/*" on:change={pickFile(f => qPhoto1 = f)} hidden>
                </label>
              </div>
              <div class="upload-cell">
                <label>Room photo – Angle 2 <span class="req">*</span></label>
                <label class="file-btn" class:has-file={!!qPhoto2}>
                  {qPhoto2 ? qPhoto2.name : '📷 Choose image'}
                  <input type="file" accept="image/*" on:change={pickFile(f => qPhoto2 = f)} hidden>
                </label>
              </div>
            </div>

            <div class="addons">
              <div class="addon-title">Select services <span class="req">*</span></div>
              {#each SERVICES as svc}
                <label class="addon">
                  <input type="checkbox" checked={qSelected.has(svc.id)} on:change={() => toggleService(svc.id)}>
                  <span>{svc.icon} {svc.label} <span class="price">${svc.price}</span></span>
                </label>
              {/each}
            </div>

            {#if total > 0}
              <div class="total-row">
                <span class="total-label">Total</span>
                <span class="total-value">${total}</span>
              </div>
            {/if}

            {#if qErr}<p class="err">{qErr}</p>{/if}

            <button class="submit" on:click={submitQuote} disabled={!quoteOk || qBusy}>
              {qBusy ? 'Sending…' : 'Send quote request'}
            </button>
            {#if !quoteOk}
              <p class="hint">
                {#if !qName.trim() || !qEmail.trim()}Fill in name and email. {/if}
                {#if !descOk}Description needs at least 20 characters. {/if}
                {#if !qPhoto1 || !qPhoto2}Both room photos are required. {/if}
                {#if qSelected.size === 0}Select at least one service.{/if}
              </p>
            {/if}
          {/if}
        </div>
      {/if}

      <!-- ── Tab 2: Feedback ──────────────────────────────────────────────── -->
      {#if tab === 'feedback'}
        <div class="body">
          {#if fDone}
            <div class="success">
              <div class="success-icon">✓</div>
              <p class="success-title">Thanks for the feedback!</p>
              <p class="success-sub">We read every submission and really appreciate it.</p>
            </div>
          {:else}
            <div class="toggle-group" role="radiogroup" aria-label="Feedback type">
              <button
                class="toggle" class:active={fType === 'question'}
                on:click={() => (fType = 'question')}
                role="radio" aria-checked={fType === 'question'}
              >? Question</button>
              <button
                class="toggle" class:active={fType === 'feature'}
                on:click={() => (fType = 'feature')}
                role="radio" aria-checked={fType === 'feature'}
              >✦ Feature Request</button>
              <button
                class="toggle" class:active={fType === 'bug'}
                on:click={() => (fType = 'bug')}
                role="radio" aria-checked={fType === 'bug'}
              >⚠ Bug Report</button>
              <button
                class="toggle" class:active={fType === 'compliment'}
                on:click={() => (fType = 'compliment')}
                role="radio" aria-checked={fType === 'compliment'}
              >👍 Compliment</button>
            </div>

            <label for="f-subj">Subject <span class="req">*</span></label>
            <input id="f-subj" type="text" bind:value={fSubject} placeholder={fType === 'feature' ? 'e.g. Add undo / redo' : fType === 'bug' ? 'e.g. Canvas flickers on zoom' : fType === 'compliment' ? 'e.g. Love the snap-to-grid!' : 'e.g. How do I export to PDF?'}>

            <label for="f-desc">Description <span class="req">*</span></label>
            <textarea
              id="f-desc"
              bind:value={fDesc}
              rows="4"
              placeholder={fType === 'feature'
                ? 'Describe the feature and why it would help you…'
                : fType === 'bug'
                ? 'Steps to reproduce, what you expected vs. what happened…'
                : fType === 'compliment'
                ? 'Tell us what you love — it makes our day! 😊'
                : 'Ask away — no question is too small!'}
            ></textarea>

            <label>Screenshot (optional)</label>
            <label class="file-btn" class:has-file={!!fShot}>
              {fShot ? fShot.name : '🖼 Attach screenshot'}
              <input type="file" accept="image/*" on:change={pickFile(f => fShot = f)} hidden>
            </label>

            {#if fErr}<p class="err">{fErr}</p>{/if}

            <button
              class="submit"
              on:click={submitFeedback}
              disabled={!feedbackOk || fBusy}
            >
              {fBusy ? 'Sending…' : 'Send feedback'}
            </button>
          {/if}
        </div>
      {/if}

      <!-- ── Tab 3: Donate ────────────────────────────────────────────────── -->
      {#if tab === 'donate'}
        <div class="body donate-body">
          <div class="coffee-icon">☕</div>
          <p class="donate-title">Support this project</p>
          <p class="donate-text">
            Room Layout Designer is free to use. If it's saved you time or sparked a great idea, buying a coffee goes a long way toward keeping the lights on and new features coming!
          </p>
          <a class="coffee-btn" href={DONATE_URL} target="_blank" rel="noopener noreferrer">
            Buy Me a Coffee ☕
          </a>

          <div class="donate-divider"><span>or</span></div>

          {#if adDone}
            <div class="ad-done">✓ Thanks for watching — you're awesome!</div>
          {:else if adWatching}
            <button class="ad-btn watching" disabled>
              ▶ Ad playing… {adSeconds}s
            </button>
          {:else}
            <button class="ad-btn" on:click={startAd}>
              ▶ Watch a 30-sec ad
            </button>
          {/if}
          <p class="ad-note">Free way to support us — no account needed.</p>

          <p class="donate-thanks">Thank you so much — it genuinely means a lot.</p>
        </div>
      {/if}

    </div>
  </div>
{/if}

<style>
  /* ── Trigger button ────────────────────────────────────────────────────── */
  .help-btn {
    position: fixed;
    top: 14px;
    right: 14px;
    z-index: 100;
    padding: 8px 14px;
    background: #4a90e2;
    color: #fff;
    border: none;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(74,144,226,.35);
    transition: background .15s, box-shadow .15s;
    letter-spacing: .2px;
  }
  .help-btn:hover {
    background: #2f78d6;
    box-shadow: 0 3px 14px rgba(74,144,226,.45);
  }

  /* ── Backdrop ──────────────────────────────────────────────────────────── */
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }

  /* ── Modal shell ───────────────────────────────────────────────────────── */
  .modal {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 40px rgba(0,0,0,.18);
    width: 480px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 48px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  /* ── Header / tabs ─────────────────────────────────────────────────────── */
  .modal-header {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #e0e0e0;
    padding: 0 14px 0 0;
    flex-shrink: 0;
  }
  .tabs {
    display: flex;
    flex: 1;
    gap: 0;
  }
  .tabs button {
    flex: 1;
    padding: 13px 8px;
    border: none;
    background: none;
    font-size: 12px;
    font-weight: 500;
    color: #888;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color .15s, border-color .15s;
    white-space: nowrap;
  }
  .tabs button:hover { color: #4a90e2; }
  .tabs button.active { color: #1a56c4; border-bottom-color: #4a90e2; font-weight: 600; }

  .close {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid #e0e0e0;
    background: #fafafa;
    color: #888;
    font-size: 12px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background .12s;
  }
  .close:hover { background: #f0f0f0; color: #333; }

  /* ── Tab body ──────────────────────────────────────────────────────────── */
  .body {
    overflow-y: auto;
    padding: 18px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .blurb { font-size: 12px; color: #666; margin-bottom: 8px; }

  label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #666;
    margin-top: 10px;
    margin-bottom: 3px;
  }
  label:first-of-type { margin-top: 0; }
  .req { color: #c0392b; }

  input[type=text],
  input[type=email],
  textarea {
    width: 100%;
    padding: 7px 10px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    font-size: 13px;
    font-family: inherit;
    background: #fafafa;
    color: #222;
    outline: none;
    resize: vertical;
    transition: border-color .15s;
  }
  input[type=text]:focus,
  input[type=email]:focus,
  textarea:focus { border-color: #4a90e2; background: #fff; }

  .char-hint {
    margin-left: auto;
    font-size: 10px;
    color: #bbb;
    transition: color .2s;
  }
  .char-hint.ok { color: #2e9c5a; }

  /* ── File upload ───────────────────────────────────────────────────────── */
  .upload-row {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  .upload-cell { flex: 1; display: flex; flex-direction: column; gap: 3px; }
  .upload-cell label { font-size: 11px; color: #666; margin: 0; }

  .file-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 10px;
    border: 1.5px dashed #d0d0d0;
    border-radius: 6px;
    font-size: 11px;
    color: #888;
    cursor: pointer;
    text-align: center;
    background: #fafafa;
    transition: border-color .15s, color .15s;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 0;
  }
  .file-btn:hover { border-color: #4a90e2; color: #4a90e2; background: #f0f5ff; }
  .file-btn.has-file { border-style: solid; border-color: #2e9c5a; color: #2e9c5a; background: #f0faf4; }

  /* ── Pricing overview ─────────────────────────────────────────────────── */
  .pricing-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 6px 0 14px;
  }
  .pricing-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 13px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fafafa;
  }
  .svc-icon { font-size: 20px; flex-shrink: 0; }
  .svc-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .svc-name { font-size: 13px; font-weight: 600; color: #222; }
  .svc-desc { font-size: 11px; color: #888; line-height: 1.4; }
  .svc-price { font-size: 15px; font-weight: 700; color: #1a56c4; flex-shrink: 0; }

  .back-btn {
    background: none;
    border: none;
    padding: 0 0 6px;
    font-size: 12px;
    color: #4a90e2;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
  }
  .back-btn:hover { color: #1a56c4; }

  /* ── Add-ons ───────────────────────────────────────────────────────────── */
  .addons {
    margin-top: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 10px 12px;
    background: #fafafa;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .addon-title { font-size: 11px; font-weight: 600; color: #555; margin-bottom: 2px; }
  .addon {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #333;
    cursor: pointer;
    margin: 0;
  }
  .addon input[type=checkbox] { width: 15px; height: 15px; cursor: pointer; accent-color: #4a90e2; }
  .price { color: #4a90e2; font-weight: 600; font-size: 12px; margin-left: 4px; }

  /* ── Total ─────────────────────────────────────────────────────────────── */
  .total-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    padding: 10px 12px;
    background: #e8f0fe;
    border-radius: 8px;
  }
  .total-label { font-size: 12px; font-weight: 600; color: #1a56c4; }
  .total-value { font-size: 18px; font-weight: 700; color: #1a56c4; }

  /* ── Submit ────────────────────────────────────────────────────────────── */
  .submit {
    margin-top: 14px;
    padding: 10px;
    width: 100%;
    background: #222;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background .15s;
  }
  .submit:hover:not(:disabled) { background: #3a3a3a; }
  .submit:disabled { opacity: .45; cursor: not-allowed; }

  .hint {
    font-size: 11px;
    color: #c0392b;
    margin-top: 5px;
    line-height: 1.5;
  }
  .err {
    font-size: 12px;
    color: #c0392b;
    background: #fff0f0;
    border: 1px solid #f5c6c6;
    border-radius: 6px;
    padding: 8px 10px;
    margin-top: 6px;
  }

  /* ── Success ───────────────────────────────────────────────────────────── */
  .success {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 0 8px;
    text-align: center;
  }
  .success-icon {
    width: 48px; height: 48px;
    border-radius: 50%;
    background: #e8f5ee;
    color: #2e9c5a;
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .success-title { font-size: 16px; font-weight: 700; color: #222; }
  .success-sub   { font-size: 13px; color: #666; }

  /* ── Feedback toggle ───────────────────────────────────────────────────── */
  .toggle-group {
    display: flex;
    gap: 6px;
    margin-bottom: 10px;
  }
  .toggle {
    flex: 1;
    padding: 8px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fafafa;
    font-size: 12px;
    font-family: inherit;
    color: #666;
    cursor: pointer;
    font-weight: 500;
    transition: all .15s;
  }
  .toggle:hover { border-color: #4a90e2; color: #4a90e2; }
  .toggle.active { background: #e8f0fe; border-color: #4a90e2; color: #1a56c4; font-weight: 600; }

  /* ── Donate tab ────────────────────────────────────────────────────────── */
  .donate-body {
    align-items: center;
    text-align: center;
    padding: 28px 24px 28px;
    gap: 10px;
  }
  .coffee-icon { font-size: 44px; line-height: 1; }
  .donate-title { font-size: 18px; font-weight: 700; color: #222; }
  .donate-text  { font-size: 13px; color: #555; line-height: 1.6; max-width: 340px; }
  .coffee-btn {
    display: inline-flex;
    align-items: center;
    padding: 11px 22px;
    background: #FFDD00;
    color: #222;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    font-family: inherit;
    text-decoration: none;
    box-shadow: 0 2px 8px rgba(0,0,0,.12);
    transition: background .15s, box-shadow .15s;
    margin-top: 6px;
  }
  .coffee-btn:hover { background: #f0cf00; box-shadow: 0 3px 12px rgba(0,0,0,.18); }
  .donate-thanks { font-size: 12px; color: #999; margin-top: 4px; }
  .donate-divider {
    display: flex; align-items: center; gap: 10px;
    width: 100%; max-width: 260px; color: #ccc; font-size: 12px;
  }
  .donate-divider::before, .donate-divider::after {
    content: ''; flex: 1; height: 1px; background: #e8e8e8;
  }
  .ad-btn {
    padding: 10px 22px;
    background: #fff;
    color: #333;
    border: 1.5px solid #e0e0e0;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: border-color .15s, background .15s, color .15s;
  }
  .ad-btn:hover:not(:disabled) { border-color: #4a90e2; color: #1a56c4; background: #f0f5ff; }
  .ad-btn.watching { color: #888; cursor: default; border-style: dashed; }
  .ad-note { font-size: 11px; color: #bbb; margin-top: -2px; }
  .ad-done {
    padding: 10px 18px;
    background: #f0faf4;
    border: 1px solid #b8e6cc;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #2e9c5a;
  }
</style>
