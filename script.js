/* =============================================================
   FlowAI — script.js
   Vanilla JS: mobile nav, AI Assistant demo chat, contact form.
   ============================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initChat();
  initContactForm();
  initFeatureModal();
  initScrollReveal();
});

/* ---------------------------------------------------------------
   Mobile navigation
--------------------------------------------------------------- */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!hamburger || !mobileMenu) return;

  const closeMenu = () => {
    mobileMenu.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const openMenu = () => {
    mobileMenu.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('is-open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close the menu whenever a link inside it is tapped
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

/* ---------------------------------------------------------------
   AI Assistant — frontend demo chat
   To connect this to a real workflow later, set N8N_WEBHOOK_URL
   below to your n8n webhook endpoint. When it is empty, FlowAI
   falls back to a set of local demo responses so the interface
   still works out of the box.
--------------------------------------------------------------- */
const N8N_WEBHOOK_URL = "";

function initChat() {
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatBody = document.getElementById('chatBody');
  const typingIndicator = document.getElementById('typingIndicator');

  if (!chatForm || !chatInput || !chatBody) return;

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';
    chatInput.focus();

    setSendingState(true);
    showTyping(true);

    try {
      const reply = N8N_WEBHOOK_URL
        ? await getWebhookReply(text)
        : await getDemoReply(text);

      showTyping(false);
      appendMessage('ai', reply);
    } catch (err) {
      showTyping(false);
      appendMessage('ai', "Sorry, something went wrong reaching the assistant. Please try again.");
      console.error('FlowAI chat error:', err);
    } finally {
      setSendingState(false);
    }
  });

  function setSendingState(isSending) {
    const sendBtn = chatForm.querySelector('.chat-send');
    if (sendBtn) sendBtn.disabled = isSending;
  }

  function showTyping(show) {
    if (!typingIndicator) return;
    typingIndicator.hidden = !show;
    if (show) chatBody.scrollTop = chatBody.scrollHeight;
  }

  function appendMessage(role, text) {
    const wrapper = document.createElement('div');
    wrapper.className = `chat-msg chat-msg--${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'chat-msg__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = role === 'ai' ? 'AI' : 'You';

    const bubble = document.createElement('div');
    bubble.className = 'chat-msg__bubble';
    bubble.textContent = text;

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    chatBody.appendChild(wrapper);

    chatBody.scrollTop = chatBody.scrollHeight;
  }
}

/**
 * Sends the user's message to an n8n webhook and returns the reply text.
 * Only used once N8N_WEBHOOK_URL is set to a real endpoint.
 * Expects the webhook to respond with JSON like { "reply": "..." }.
 */
async function getWebhookReply(message) {
  const response = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`Webhook responded with status ${response.status}`);
  }

  const data = await response.json();
  return data.reply || "I didn't get a response back — please try again.";
}

/**
 * Local demo responses. This is a frontend-only simulation, not a
 * real AI model — it exists so the chat interface is functional
 * before an n8n webhook (or other backend) is connected.
 */
function getDemoReply(message) {
  const lower = message.toLowerCase();

  let reply;
  if (/\b(hi|hello|hey)\b/.test(lower)) {
    reply = "Hello! I'm a frontend demo of the FlowAI assistant. Try asking me to automate a task or summarize something.";
  } else if (lower.includes('automat')) {
    reply = "In the full version, I'd map out the steps of that task and suggest a workflow you could turn on with one click.";
  } else if (lower.includes('report') || lower.includes('summar')) {
    reply = "Got it — I'd pull the relevant data together and generate a clear summary for you. This demo just simulates that response.";
  } else if (lower.includes('help')) {
    reply = "I can help with quick answers, task automation ideas, and summarizing information once connected to a real backend.";
  } else {
    reply = "Thanks for the message! This is a demo response — connect FlowAI to your n8n webhook to get real AI-generated replies.";
  }

  // Simulate a short thinking delay so the typing indicator is visible.
  return new Promise((resolve) => {
    setTimeout(() => resolve(reply), 900 + Math.random() * 500);
  });
}

/* ---------------------------------------------------------------
   Contact form — validation + demo success state
--------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const nameField = document.getElementById('name');
  const emailField = document.getElementById('email');
  const subjectField = document.getElementById('subject');
  const messageField = document.getElementById('message');
  const successBox = document.getElementById('formSuccess');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isNameValid = validateField(nameField, 'nameError', (v) => v.trim().length >= 2,
      'Please enter your name.');
    const isEmailValid = validateField(emailField, 'emailError', (v) => isValidEmail(v),
      'Please enter a valid email address.');
    const isSubjectValid = validateField(subjectField, 'subjectError', (v) => v.trim().length >= 2,
      'Please enter a subject.');
    const isMessageValid = validateField(messageField, 'messageError', (v) => v.trim().length >= 10,
      'Please write a message of at least 10 characters.');

    if (isNameValid && isEmailValid && isSubjectValid && isMessageValid) {
      successBox.hidden = false;
      form.reset();
      clearFieldStates();
      successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Hide the success message again after a while so the form is reusable.
      setTimeout(() => { successBox.hidden = true; }, 6000);
    } else {
      successBox.hidden = true;
    }
  });

  // Clear an individual field's error as soon as the user fixes it.
  [nameField, emailField, subjectField, messageField].forEach((field) => {
    field.addEventListener('input', () => {
      const errorId = field.id + 'Error';
      const errorEl = document.getElementById(errorId);
      field.closest('.form-field').classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
    });
  });

  function validateField(field, errorId, validatorFn, message) {
    const errorEl = document.getElementById(errorId);
    const wrapper = field.closest('.form-field');
    const value = field.value || '';

    if (!validatorFn(value)) {
      wrapper.classList.add('has-error');
      if (errorEl) errorEl.textContent = message;
      return false;
    }

    wrapper.classList.remove('has-error');
    if (errorEl) errorEl.textContent = '';
    return true;
  }

  function clearFieldStates() {
    form.querySelectorAll('.form-field').forEach((el) => el.classList.remove('has-error'));
    form.querySelectorAll('.form-error').forEach((el) => { el.textContent = ''; });
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }
}
/* ---------------------------------------------------------------
   Scroll-triggered entrance animations
   Adds "is-visible" to any .reveal element once it scrolls into
   view. Falls back to showing everything immediately if
   IntersectionObserver isn't supported.
--------------------------------------------------------------- */
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((el) => observer.observe(el));
}

/* ---------------------------------------------------------------
   Feature detail modal
   Each of the 4 feature cards opens a shared modal populated with
   content from FEATURE_DETAILS below. Nothing here claims a live
   backend, automation, or integration is connected — see the
   "note" field on features that are conceptual/roadmap only.
--------------------------------------------------------------- */
const FEATURE_DETAILS = {
  'ai-assistant': {
    badge: 'Feature',
    title: 'AI Assistant',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M19 15l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8L19 15z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
    intro: 'A conversational interface for getting quick help, drafting content, and thinking through tasks — without switching tools or digging through menus.',
    what: 'The AI Assistant gives you a single chat window where you can ask questions, request drafts, or talk through a problem in plain language, and get a clear, useful response back.',
    how: 'You type a request in everyday language. FlowAI interprets what you\u2019re asking for, works out the most useful way to respond, and replies directly in the chat — ready to copy, refine, or act on.',
    useCases: [
      '"Summarize this meeting into three action items."',
      '"Draft a short follow-up email to a client."',
      '"Help me outline a plan for next week."',
      '"Explain this term in simple language."',
    ],
    benefits: [
      'Get help without leaving your workflow',
      'Faster first drafts for everyday writing',
      'A quick sounding board for planning and ideas',
      'Available whenever you need it, in one place',
    ],
    visual: `
      <div class="mv-card mv-chat">
        <div class="mv-chat__row">
          <span class="mv-chat__avatar">AI</span>
          <span class="mv-chat__bubble">Hi! What are you working on today?</span>
        </div>
        <div class="mv-chat__row mv-chat__row--user">
          <span class="mv-chat__avatar">You</span>
          <span class="mv-chat__bubble">Summarize this into 3 action items.</span>
        </div>
        <div class="mv-chat__row">
          <span class="mv-chat__avatar">AI</span>
          <span class="mv-chat__bubble">Sure — here are 3 clear next steps based on what you shared.</span>
        </div>
      </div>`,
    note: 'The chat below is a working frontend demo with simulated replies — it isn\u2019t connected to a live AI model yet.',
    cta: { label: 'Try it in the demo', target: '#ai-assistant' },
  },

  'workflow-automation': {
    badge: 'Feature',
    title: 'Workflow Automation',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="4" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.6"/><rect x="13.5" y="13" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.6"/><path d="M7 11v3a2 2 0 0 0 2 2h4.5M17 13V9.5A2 2 0 0 0 15 7.5h-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    intro: 'A way to turn repeatable, multi-step tasks into a workflow that runs on its own instead of being done by hand each time.',
    what: 'Workflow Automation is designed to take a request, break it into steps, carry those steps out, and hand back a finished result — the kind of task you\u2019d otherwise repeat manually every day or week.',
    how: 'You describe the outcome you want. FlowAI plans the steps needed to get there and runs them through an automation, so the result lands with no manual work in between.',
    useCases: [
      'Turning a weekly data export into an automatic summary report',
      'Collecting form responses and organizing them automatically',
      'Sending a scheduled digest to a team every Monday morning',
      'Moving information between two tools without copy-pasting',
    ],
    benefits: [
      'Less time spent on repetitive, manual steps',
      'Consistent results every time a task runs',
      'Frees up focus for higher-value work',
      'Scales from a single task to a full workflow',
    ],
    visual: `
      <div class="mv-card mv-flow">
        <div class="mv-flow__node">
          <span>User Request</span>
          <small>What you need</small>
        </div>
        <span class="mv-flow__arrow" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <div class="mv-flow__node mv-flow__node--accent">
          <span>FlowAI</span>
          <small>Plans the steps</small>
        </div>
        <span class="mv-flow__arrow" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <div class="mv-flow__node">
          <span>Automation</span>
          <small>Runs the task</small>
        </div>
        <span class="mv-flow__arrow" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <div class="mv-flow__node">
          <span>Result</span>
          <small>Delivered to you</small>
        </div>
      </div>`,
    note: 'This diagram shows the intended workflow concept. Automations aren\u2019t connected or running live in this version of the site.',
    cta: { label: 'See how it works', target: '#how-it-works' },
  },

  'smart-productivity': {
    badge: 'Feature',
    title: 'Smart Productivity',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 19V13M4 13a4 4 0 0 1 4-4h1M4 13V7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 19V9M20 19V5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M15 9l5-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    intro: 'Everyday support for planning, organizing, and thinking through tasks — so your day has less friction and more structure.',
    what: 'Smart Productivity focuses on the small, constant decisions that make up a workday: what to prioritize, how to structure a task list, and where to start when something feels overwhelming.',
    how: 'You bring a goal, a messy list, or a rough idea. FlowAI helps organize it into a clearer plan, breaks it into steps, or suggests a structure you can act on right away.',
    useCases: [
      'Turning a brain-dump of tasks into a prioritized list',
      'Planning out a project timeline before you start',
      'Brainstorming ideas when you\u2019re stuck on where to begin',
      'Organizing notes from a call into a clear next-steps list',
    ],
    benefits: [
      'Clearer structure for busy or scattered days',
      'Less time spent deciding where to start',
      'A quick way to unblock stalled thinking',
      'Simple planning support without extra tools',
    ],
    visual: `
      <div class="mv-card mv-tasks">
        <div class="mv-task mv-task--done">
          <span class="mv-task__check" aria-hidden="true"></span>
          <span>Organize this week\u2019s priorities</span>
        </div>
        <div class="mv-task mv-task--done">
          <span class="mv-task__check" aria-hidden="true"></span>
          <span>Draft outline for client proposal</span>
        </div>
        <div class="mv-task">
          <span class="mv-task__check" aria-hidden="true"></span>
          <span>Plan next sprint\u2019s task list</span>
        </div>
      </div>`,
    note: '',
    cta: { label: 'Try it in the demo', target: '#ai-assistant' },
  },

  'easy-integration': {
    badge: 'Roadmap',
    title: 'Easy Integration',
    icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="12" r="2.6" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="6" r="2.6" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="18" r="2.6" stroke="currentColor" stroke-width="1.6"/><path d="M8.3 10.8L15.7 7.2M8.3 13.2l7.4 3.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    intro: 'A plan for connecting FlowAI to the tools and services you already use, so it can fit into an existing workflow rather than living apart from it.',
    what: 'Easy Integration describes how FlowAI is designed to connect outward — to APIs, webhooks, and automation platforms like n8n — so requests and results can flow between FlowAI and the rest of your stack.',
    how: 'FlowAI would send and receive data through standard webhooks and API calls. An automation platform such as n8n can sit in between, routing requests to the right service and passing results back.',
    useCases: [
      'Triggering an n8n workflow from a FlowAI request',
      'Sending FlowAI output into a webhook for another tool',
      'Connecting to a third-party API to pull in live data',
      'Linking FlowAI to an existing automation pipeline',
    ],
    benefits: [
      'Fits into tools you already use',
      'No need to rebuild existing workflows',
      'Flexible connection points via webhooks and APIs',
      'Designed to extend rather than replace your stack',
    ],
    visual: `
      <div class="mv-card mv-integrations">
        <div class="mv-hub">FlowAI</div>
        <div class="mv-integrations__nodes">
          <div class="mv-node"><span>REST API</span><small>Planned</small></div>
          <div class="mv-node"><span>Webhook</span><small>Planned</small></div>
          <div class="mv-node"><span>n8n</span><small>Planned</small></div>
          <div class="mv-node"><span>AI Service</span><small>Planned</small></div>
        </div>
      </div>`,
    note: 'These integrations are on the roadmap. No API, webhook, or n8n connection is active in this version of the site.',
    cta: { label: 'Get in touch', target: '#contact' },
  },
};

function initFeatureModal() {
  const overlay = document.getElementById('featureModalOverlay');
  const modal = document.getElementById('featureModal');
  const closeBtn = document.getElementById('featureModalClose');
  const cards = document.querySelectorAll('.feature-card[data-feature]');
  if (!overlay || !modal || !cards.length) return;
  const iconEl = document.getElementById('featureModalIcon');
  const badgeEl = document.getElementById('featureModalBadge');
  const titleEl = document.getElementById('featureModalTitle');
  const introEl = document.getElementById('featureModalIntro');
  const visualEl = document.getElementById('featureModalVisual');
  const whatEl = document.getElementById('featureModalWhat');
  const howEl = document.getElementById('featureModalHow');
  const useCasesEl = document.getElementById('featureModalUseCases');
  const benefitsEl = document.getElementById('featureModalBenefits');
  const noteEl = document.getElementById('featureModalNote');
  const ctaEl = document.getElementById('featureModalCta');
  let lastFocusedEl = null;
  cards.forEach((card) => {
    card.addEventListener('click', () => openFeature(card.dataset.feature, card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFeature(card.dataset.feature, card);
      }
    });
  });
  closeBtn.addEventListener('click', closeFeature);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeFeature();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-visible')) {
      closeFeature();
    }
  });
  function openFeature(id, triggerEl) {
    const data = FEATURE_DETAILS[id];
    if (!data) return;
    lastFocusedEl = triggerEl || document.activeElement;
    iconEl.innerHTML = data.icon;
    badgeEl.textContent = data.badge;
    badgeEl.classList.toggle('feature-modal__badge--muted', data.badge === 'Roadmap');
    titleEl.textContent = data.title;
    introEl.textContent = data.intro;
    visualEl.innerHTML = data.visual;
    whatEl.textContent = data.what;
    howEl.textContent = data.how;
    useCasesEl.innerHTML = '';
    data.useCases.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      useCasesEl.appendChild(li);
    });
    benefitsEl.innerHTML = '';
    data.benefits.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      benefitsEl.appendChild(li);
    });
    if (data.note) {
      noteEl.textContent = data.note;
      noteEl.hidden = false;
    } else {
      noteEl.hidden = true;
    }

    ctaEl.textContent = data.cta.label;
    ctaEl.setAttribute('href', data.cta.target);
    ctaEl.onclick = (e) => {
      e.preventDefault();
      closeFeature();
      const target = document.querySelector(data.cta.target);
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
      }
    };

    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
    closeBtn.focus();
  }

  function closeFeature() {
    overlay.classList.remove('is-visible');
    document.body.style.overflow = '';
    setTimeout(() => { overlay.hidden = true; }, 200);
    if (lastFocusedEl) lastFocusedEl.focus();
  }
}
/* ---------------------------------------------------------------
   AI Assistant demo (Meet Your AI Assistant section)
   Wrapped in an IIFE so nothing here touches or overwrites any
   existing variables, functions, or event listeners already in
   this file.
--------------------------------------------------------------- */
(function initAiAssistantDemo() {
  const form = document.getElementById('aiChatForm');
  const input = document.getElementById('aiChatInput');
  const body = document.getElementById('aiChatBody');
  const typingIndicator = document.getElementById('aiTypingIndicator');
  const suggestions = document.getElementById('aiChatSuggestions');

  if (!form || !input || !body) return;

  // Placeholder for later: set this to your n8n webhook URL to swap
  // the demo response below for a real one. Left empty for now.
  const N8N_WEBHOOK_URL ="https://broken-careless-crease.ngrok-free.dev/webhook-test/flowai-chat";

  // Suggested prompts just fill the input — they do not auto-send.
  if (suggestions) {
    suggestions.querySelectorAll('.ai-chat-suggestion').forEach((btn) => {
      btn.addEventListener('click', () => {
        input.value = btn.textContent.trim();
        input.focus();
      });
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    appendMessage('user', text);
    input.value = '';

    setSendingState(true);
    showTyping(true);

    try {
      const reply = N8N_WEBHOOK_URL
        ? await getWebhookReply(text)
        : await getDemoReply(text);

      showTyping(false);
      appendMessage('ai', reply);
    } catch (err) {
      showTyping(false);
      appendMessage('ai', "Sorry, something went wrong. Please try again.");
      console.error('FlowAI AI Assistant demo error:', err);
    } finally {
      setSendingState(false);
    }
  });

  function setSendingState(isSending) {
    const sendBtn = form.querySelector('.ai-chat-send');
    if (sendBtn) sendBtn.disabled = isSending;
  }

  function showTyping(show) {
    if (!typingIndicator) return;
    typingIndicator.hidden = !show;
    if (show) body.scrollTop = body.scrollHeight;
  }

  function appendMessage(role, text) {
    const wrapper = document.createElement('div');
    wrapper.className = `ai-chat-msg ai-chat-msg--${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'ai-chat-msg__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = role === 'ai' ? 'AI' : 'You';

    const bubble = document.createElement('div');
    bubble.className = 'ai-chat-msg__bubble';
    bubble.textContent = text;

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    body.appendChild(wrapper);

    body.scrollTop = body.scrollHeight;
  }

  // Ready for later: sends the message to an n8n webhook and expects
  // { "reply": "..." } back. Not used until N8N_WEBHOOK_URL is set.
  async function getWebhookReply(message) {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}`);
    }

    const data = await response.json();
    return data.reply || "I didn't get a response back — please try again.";
  }

  // Frontend-only demo responses. Not connected to any real AI model.
  function getDemoReply(message) {
    const lower = message.toLowerCase();
    let reply;

    if (lower.includes('plan') && lower.includes('day')) {
      reply = "Sure — start by listing your top 3 priorities, block time for the most important one first, and leave short buffers between tasks.";
    } else if (lower.includes('productivity') || lower.includes('tip')) {
      reply = "Try this: tackle your hardest task first, work in focused blocks, and take a short break every hour to stay sharp.";
    } else if (lower.includes('organize') || lower.includes('task')) {
      reply = "I'd group your tasks by priority, break bigger ones into smaller steps, and tackle them one at a time.";
    } else if (lower.includes('workflow')) {
      reply = "A simple workflow could look like: capture the request, break it into steps, complete each step, then review the result.";
    } else if (/\b(hi|hello|hey)\b/.test(lower)) {
      reply = "Hi there! I'm a demo of the FlowAI assistant. Ask me about planning, productivity, or organizing tasks.";
    } else {
      reply = "Thanks for the message! This is a demo response — connecting FlowAI to a real backend will let me answer things like this directly.";
    }

    return new Promise((resolve) => {
      setTimeout(() => resolve(reply), 900 + Math.random() * 500);
    });
  }
})();