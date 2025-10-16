/* app.js
   SPA básico, templates, validação com checagem de consistência, armazenamento local
*/
(() => {
  'use strict';

  /* ---------- Utilities ---------- */
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));

  /* ---------- Template Engine (very small) ---------- */
  const Templates = {
    get(name) {
      const tpl = document.getElementById(`tpl-${name}`);
      return tpl ? tpl.innerHTML : `<p>Template ${name} não encontrado.</p>`;
    }
  };

  /* ---------- Router (hash-based) ---------- */
  const Router = {
    routes: {
      '/': 'home',
      '/projetos': 'projetos',
      '/sobre': 'sobre',
      '/contato': 'contato'
    },
    init() {
      window.addEventListener('hashchange', Router.loadFromHash);
      document.addEventListener('click', Router.linkHandler);
      Router.loadFromHash();
    },
    getPathFromHash() {
      const hash = location.hash.replace(/^#/, '') || '/';
      return hash;
    },
    loadFromHash() {
      const path = Router.getPathFromHash();
      const tplName = Router.routes[path] || 'home';
      UI.render(tplName);
      UI.updateActiveNav(path);
    },
    linkHandler(e) {
      // Allow normal behavior for external links
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        // let hashchange handle it
        return;
      }
    }
  };

  /* ---------- Storage (localStorage for saved messages) ---------- */
  const Storage = {
    key: 'entrega3_messages',
    getAll() {
      try {
        const raw = localStorage.getItem(Storage.key);
        return raw ? JSON.parse(raw) : [];
      } catch (err) {
        console.error('Erro ao ler storage', err);
        return [];
      }
    },
    save(msg) {
      const arr = Storage.getAll();
      arr.unshift(msg);
      localStorage.setItem(Storage.key, JSON.stringify(arr));
    },
    clear() {
      localStorage.removeItem(Storage.key);
    }
  };

  /* ---------- Validator ---------- */
  const Validator = {
    errors: {},
    validateForm(form) {
      this.errors = {};
      const nome = form.nome.value.trim();
      const email = form.email.value.trim();
      const emailConfirm = form.emailConfirm.value.trim();
      const mensagem = form.mensagem.value.trim();

      if (nome.length < 3) this.errors.nome = 'Nome deve ter ao menos 3 caracteres.';
      if (!/^\S+@\S+\.\S+$/.test(email)) this.errors.email = 'Email inválido.';
      if (email !== emailConfirm) this.errors.emailConfirm = 'Emails não coincidem.';
      if (mensagem.length < 10) this.errors.mensagem = 'Mensagem curta — mínimo 10 caracteres.';

      return Object.keys(this.errors).length === 0;
    },
    showErrors(form) {
      // clear all error fields
      $$('.error').forEach(el => el.textContent = '');
      for (const key in this.errors) {
        const el = form.querySelector(`.error[data-for="${key}"]`);
        if (el) el.textContent = this.errors[key];
      }
    }
  };

  /* ---------- UI behaviors ---------- */
  const UI = {
    appEl: $('#app'),
    render(templateName) {
      const html = Templates.get(templateName);
      this.appEl.innerHTML = html;
      // after injecting, call init for that page
      this.afterRender(templateName);
    },
    afterRender(name) {
      // set copyright year
      $('#ano').textContent = new Date().getFullYear();

      // small page-specific inits
      if (name === 'projetos') {
        this.initGallery();
      }
      if (name === 'contato') {
        this.initContact();
      }

      // mobile menu toggle
      const menuToggle = $('#menu-toggle');
      if (menuToggle) {
        menuToggle.onclick = () => {
          const nav = document.querySelector('.main-nav');
          const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
          menuToggle.setAttribute('aria-expanded', String(!expanded));
          if (nav) nav.style.display = expanded ? 'none' : 'flex';
        };
      }
    },
    updateActiveNav(path) {
      $$('.nav-link').forEach(a => {
        const route = a.getAttribute('data-route') || '/';
        if (route === path) a.classList.add('active');
        else a.classList.remove('active');
      });
    },
    initGallery() {
      const gallery = $('#gallery');
      const modal = $('#modal');
      const modalImg = $('#modal-img');
      const modalTitle = $('#modal-title');
      const modalClose = $('#modal-close');

      if (!gallery) return;
      gallery.addEventListener('click', (ev) => {
        const img = ev.target.closest('img');
        if (!img) return;
        modalImg.src = img.src;
        modalImg.alt = img.alt || img.dataset.title || 'Imagem';
        modalTitle.textContent = img.dataset.title || '';
        modal.setAttribute('aria-hidden', 'false');
      });
      modalClose.addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) modal.setAttribute('aria-hidden', 'true');
      });
    },
    initContact() {
      const form = $('#contact-form');
      const saveDraft = $('#save-draft');
      const savedList = $('#saved-messages');
      const status = $('#form-message');

      const renderSaved = () => {
        const arr = Storage.getAll();
        savedList.innerHTML = arr.length ? arr.map((m, idx) => `
          <li>
            <strong>${m.nome}</strong> — ${m.email}
            <p>${m.mensagem}</p>
            <button data-idx="${idx}" class="del-btn">Excluir</button>
          </li>
        `).join('') : '<li>Nenhuma mensagem salva.</li>';
        // attach delete handlers
        $$('.del-btn').forEach(btn => {
          btn.onclick = (e) => {
            const idx = Number(btn.dataset.idx);
            const arr = Storage.getAll();
            arr.splice(idx,1);
            localStorage.setItem(Storage.key, JSON.stringify(arr));
            renderSaved();
          };
        });
      };

      // load saved messages list
      renderSaved();

      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        status.textContent = '';
        if (!Validator.validateForm(form)) {
          Validator.showErrors(form);
          status.textContent = 'Corrija os erros antes de enviar.';
          return;
        }
        // All good: save message (simulate envio)
        const message = {
          nome: form.nome.value.trim(),
          email: form.email.value.trim(),
          mensagem: form.mensagem.value.trim(),
          data: new Date().toISOString()
        };
        Storage.save(message);
        renderSaved();
        form.reset();
        status.textContent = 'Mensagem salva localmente (simula envio).';
        // Optionally: could send via fetch to backend
      });

      saveDraft.addEventListener('click', () => {
        const draft = {
          nome: form.nome.value.trim(),
          email: form.email.value.trim(),
          mensagem: form.mensagem.value.trim(),
          data: new Date().toISOString()
        };
        Storage.save(draft);
        renderSaved();
        $('#form-message').textContent = 'Rascunho salvo localmente.';
      });

      // Real-time validation: on blur check field
      ['nome','email','emailConfirm','mensagem'].forEach(id => {
        const el = $(`#${id}`);
        if (!el) return;
        el.addEventListener('blur', () => {
          // trigger validation for that field
          Validator.validateForm(form);
          Validator.showErrors(form);
        });
      });
    }
  };

  // inicialização
  document.addEventListener('DOMContentLoaded', () => {
    Router.init();
  });

})();
