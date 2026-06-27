
/* ===== CLOUD COMPARE AI - Main Script ===== */

// ─── Active Nav Link ───────────────────────────────────────────────────────
function setActiveNav() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === current) a.classList.add('active');
    else a.classList.remove('active');
  });
}

// ─── Smooth Scroll for Anchors ─────────────────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ─── Navbar Scroll Effect ─────────────────────────────────────────────────
function initNavScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 10
      ? '0 4px 24px rgba(0,0,0,0.4)'
      : 'none';
  });
}

// ─── Fade-Up Observer ─────────────────────────────────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.animationDelay = `${i * 60}ms`;
        entry.target.classList.add('animate-fade-up');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.card, .section-header, .compare-table-wrapper')
    .forEach(el => observer.observe(el));
}

// ─── Tab Switcher ─────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tabs').forEach(tabGroup => {
    const buttons = tabGroup.querySelectorAll('.tab-btn');
    const targetAttr = tabGroup.dataset.target;

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (targetAttr) {
          const panels = document.querySelectorAll(`[data-panel]`);
          panels.forEach(p => {
            p.style.display = p.dataset.panel === btn.dataset.tab ? 'block' : 'none';
          });
        }

        const onTab = btn.dataset.onTab;
        if (onTab && window[onTab]) window[onTab](btn.dataset.tab);
      });
    });
  });
}

// ─── Score Bars Animation ─────────────────────────────────────────────────
function animateScoreBars() {
  document.querySelectorAll('.score-fill').forEach(bar => {
    const target = bar.dataset.score || '0';
    bar.style.width = '0';
    setTimeout(() => {
      bar.style.transition = 'width 0.8s cubic-bezier(0.4,0,0.2,1)';
      bar.style.width = target + '%';
    }, 200);
  });
}

// ─── Copy to Clipboard ────────────────────────────────────────────────────
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Copied!');
  });
}

// ─── Toast Notification ───────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span>${message}</span>`;
  toast.style.cssText = `
    position: fixed; bottom: 2rem; right: 2rem;
    background: #1a2235; border: 1px solid #2a3f5f;
    color: #f0f4ff; border-radius: 10px;
    padding: 0.75rem 1.25rem; display: flex;
    align-items: center; gap: 8px; font-size: 0.88rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    z-index: 9999; animation: fadeUp 0.3s ease both;
    font-family: 'Inter', sans-serif;`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// ─── Filter / Search Table ────────────────────────────────────────────────
function initTableSearch() {
  const searchInput = document.getElementById('tableSearch');
  if (!searchInput) return;
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    document.querySelectorAll('.compare-table tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

// ─── Pricing Calculator Helper ────────────────────────────────────────────
const PricingCalc = {
  rates: {
    aws:   { compute: 0.096, storage: 0.023, egress: 0.09, database: 0.115 },
    azure: { compute: 0.092, storage: 0.020, egress: 0.087, database: 0.105 },
    gcp:   { compute: 0.080, storage: 0.020, egress: 0.08, database: 0.095 },
  },

  estimate(provider, hours, gbStorage, gbEgress, dbHours) {
    const r = this.rates[provider];
    if (!r) return 0;
    return (
      (hours * r.compute) +
      (gbStorage * r.storage) +
      (gbEgress * r.egress) +
      (dbHours * r.database)
    );
  },

  compare(hours = 720, gbStorage = 100, gbEgress = 50, dbHours = 720) {
    return {
      aws:   this.estimate('aws',   hours, gbStorage, gbEgress, dbHours),
      azure: this.estimate('azure', hours, gbStorage, gbEgress, dbHours),
      gcp:   this.estimate('gcp',   hours, gbStorage, gbEgress, dbHours),
    };
  }
};

// ─── Chat Helpers ─────────────────────────────────────────────────────────
const Chat = {
  container: null,

  init(containerId) {
    this.container = document.getElementById(containerId);
  },

  addMessage(role, text) {
    if (!this.container) return;
    const msgEl = document.createElement('div');
    msgEl.className = `message ${role}`;
    const isAI = role === 'ai';
    msgEl.innerHTML = `
      <div class="msg-avatar ${isAI ? 'ai-avatar' : 'user-avatar'}">
        ${isAI ? '🤖' : '👤'}
      </div>
      <div class="msg-bubble">${text}</div>`;
    this.container.appendChild(msgEl);
    this.container.scrollTop = this.container.scrollHeight;
  },

  showTyping() {
    if (!this.container) return;
    const el = document.createElement('div');
    el.className = 'message ai typing-indicator';
    el.id = 'typingIndicator';
    el.innerHTML = `
      <div class="msg-avatar ai-avatar">🤖</div>
      <div class="msg-bubble" style="display:flex;gap:4px;align-items:center;">
        <span class="loading-dot" style="animation-delay:0s"></span>
        <span class="loading-dot" style="animation-delay:0.2s"></span>
        <span class="loading-dot" style="animation-delay:0.4s"></span>
      </div>`;
    this.container.appendChild(el);
    this.container.scrollTop = this.container.scrollHeight;
  },

  removeTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }
};

// ─── Cloud Data Store ─────────────────────────────────────────────────────
const CloudData = {
  providers: ['aws', 'azure', 'gcp'],
  services: {
    compute:  { aws: 'EC2',       azure: 'Azure VMs',       gcp: 'Compute Engine' },
    storage:  { aws: 'S3',        azure: 'Blob Storage',    gcp: 'Cloud Storage'  },
    database: { aws: 'RDS',       azure: 'Azure SQL',       gcp: 'Cloud SQL'      },
    ml:       { aws: 'SageMaker', azure: 'Azure ML',        gcp: 'Vertex AI'      },
    serverless:{ aws: 'Lambda',   azure: 'Azure Functions', gcp: 'Cloud Functions'},
    k8s:      { aws: 'EKS',       azure: 'AKS',             gcp: 'GKE'            },
    cdn:      { aws: 'CloudFront',azure: 'Azure CDN',       gcp: 'Cloud CDN'      },
    iam:      { aws: 'IAM',       azure: 'Azure AD',        gcp: 'Cloud IAM'      },
  },
  colors: { aws: '#ff9900', azure: '#0078d4', gcp: '#4285f4' },
  icons:  { aws: '☁️',      azure: '⚡',       gcp: '🔷'     },
};

// ─── Utility ──────────────────────────────────────────────────────────────
const fmt = {
  currency: n => '$' + n.toFixed(2),
  percent:  n => n.toFixed(1) + '%',
  number:   n => n.toLocaleString(),
};

// ─── Init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  initSmoothScroll();
  initNavScroll();
  initScrollAnimations();
  initTabs();
  initTableSearch();

  // Animate score bars if present
  const barObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      animateScoreBars();
      barObserver.disconnect();
    }
  });
  const scoreSection = document.querySelector('.score-bar');
  if (scoreSection) barObserver.observe(scoreSection);
});

// Export for use in page-specific scripts
window.CloudData    = CloudData;
window.PricingCalc  = PricingCalc;
window.Chat         = Chat;
window.fmt          = fmt;
window.showToast    = showToast;
window.copyToClipboard = copyToClipboard;
