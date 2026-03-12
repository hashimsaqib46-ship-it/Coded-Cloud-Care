(function () {
  const LOGIN_URL = '/Frontend/comp/Login.html?product=lab-reporting';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function apiRequest(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      window.location.href = LOGIN_URL;
      throw new Error('Authentication required');
    }

    let payload = {};
    try {
      payload = await response.json();
    } catch (_) {
      payload = {};
    }

    if (!response.ok || payload.success === false) {
      const message = payload.message || `Request failed (${response.status})`;
      throw new Error(message);
    }

    return payload;
  }

  function extractUser(profilePayload) {
    return profilePayload?.data?.user || null;
  }

  function applyBranding(settings, user) {
    const clinicName = settings?.clinicName || user?.companyName || 'LabPro';
    const tagline = settings?.clinicTagline || 'Diagnostics and reporting operations';
    const phone = settings?.clinicPhone || user?.contactInfo || '';
    const email = settings?.clinicEmail || user?.email || '';

    document.title = `${clinicName} - Lab Management`;

    const brandTargets = Array.from(document.querySelectorAll('a, span, h1'))
      .filter((el) => {
        const txt = String(el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        return txt === 'labpro' || txt === 'lab pro';
      });

    brandTargets.forEach((el) => {
      el.textContent = clinicName;
    });

    const userName = clinicName;
    const userNameEls = Array.from(document.querySelectorAll('p, span, div'))
      .filter((el) => String(el.textContent || '').trim() === 'Alex Durand');
    userNameEls.forEach((el) => {
      el.textContent = userName;
    });

    const roleEls = Array.from(document.querySelectorAll('p, span, div'))
      .filter((el) => String(el.textContent || '').trim() === 'Admin Access');
    roleEls.forEach((el) => {
      el.textContent = phone || email || 'Admin Access';
    });

    const heroHeading = Array.from(document.querySelectorAll('h1'))
      .find((el) => String(el.textContent || '').toLowerCase().includes('good morning'));
    if (heroHeading) {
      heroHeading.textContent = `Welcome, ${clinicName}`;
    }

    const heroTagline = Array.from(document.querySelectorAll('p'))
      .find((el) => String(el.textContent || '').toLowerCase().includes("here's what's happening in your lab today"));
    if (heroTagline) {
      heroTagline.textContent = tagline;
    }

    sessionStorage.setItem('lab_settings', JSON.stringify({
      clinicName,
      clinicTagline: tagline,
      clinicPhone: phone,
      clinicEmail: email,
      clinicAddress: settings?.clinicAddress || '',
      isOnboardingComplete: Boolean(settings?.isOnboardingComplete),
    }));
  }

  function showOnboardingModal(initialSettings, user) {
    return new Promise((resolve) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'fixed inset-0 z-[120] flex items-center justify-center p-4';
      wrapper.innerHTML = `
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200">
            <h3 class="text-xl font-black text-slate-900">Welcome to Lab Management</h3>
            <p class="text-sm text-slate-500 mt-1">Complete your setup to personalize your lab portal.</p>
          </div>
          <form data-role="form" class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label class="block">
                <span class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Lab Name</span>
                <input name="clinicName" required class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value="${escapeHtml(initialSettings?.clinicName || user?.companyName || '')}" />
              </label>
              <label class="block">
                <span class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Phone</span>
                <input name="clinicPhone" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value="${escapeHtml(initialSettings?.clinicPhone || '')}" />
              </label>
              <label class="block">
                <span class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Email</span>
                <input name="clinicEmail" type="email" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value="${escapeHtml(initialSettings?.clinicEmail || user?.email || '')}" />
              </label>
              <label class="block">
                <span class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Company Logo</span>
                <input name="clinicLogo" type="file" accept="image/*" class="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm bg-white cursor-pointer" />
              </label>
              <label class="block md:col-span-2">
                <span class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Tagline</span>
                <input name="clinicTagline" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value="${escapeHtml(initialSettings?.clinicTagline || '')}" placeholder="Fast and accurate diagnostics" />
              </label>
            </div>
            <label class="block">
              <span class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Address</span>
              <textarea name="clinicAddress" rows="3" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">${escapeHtml(initialSettings?.clinicAddress || '')}</textarea>
            </label>
            <p data-role="error" class="text-sm text-rose-600 hidden"></p>
            <div class="flex justify-end">
              <button type="submit" data-role="submit" class="px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-colors">Save and Continue</button>
            </div>
          </form>
        </div>
      `;

      document.body.appendChild(wrapper);

      const form = wrapper.querySelector('[data-role="form"]');
      const errorEl = wrapper.querySelector('[data-role="error"]');
      const submitBtn = wrapper.querySelector('[data-role="submit"]');

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorEl.classList.add('hidden');

        const clinicName = String(form.elements.namedItem('clinicName').value || '').trim();
        if (!clinicName) {
          errorEl.textContent = 'Lab name is required.';
          errorEl.classList.remove('hidden');
          return;
        }

        let clinicLogoBase64 = initialSettings?.clinicLogo || '';
        const logoInput = form.elements.namedItem('clinicLogo');
        if (logoInput && logoInput.files && logoInput.files[0]) {
          try {
            clinicLogoBase64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(logoInput.files[0]);
            });
          } catch (err) {
            console.error('Failed to read logo image', err);
          }
        }

        const payload = {
          clinicName,
          clinicPhone: String(form.elements.namedItem('clinicPhone').value || '').trim(),
          clinicEmail: String(form.elements.namedItem('clinicEmail').value || '').trim(),
          clinicTagline: String(form.elements.namedItem('clinicTagline').value || '').trim(),
          clinicAddress: String(form.elements.namedItem('clinicAddress').value || '').trim(),
          clinicLogo: clinicLogoBase64,
          isOnboardingComplete: true,
        };

        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
          const result = await apiRequest('/api/settings', {
            method: 'PUT',
            body: JSON.stringify(payload),
          });

          wrapper.remove();
          
          // Force UI to show updated info correctly and instantly
          window.location.reload();
          
          resolve(result.data || payload);
        } catch (error) {
          errorEl.textContent = error.message || 'Failed to save setup.';
          errorEl.classList.remove('hidden');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save and Continue';
        }
      });
    });
  }

  async function initialize() {
    let profilePayload = null;
    let user = null;
    let settings = null;

    try {
      profilePayload = await apiRequest('/api/auth/profile');
      user = extractUser(profilePayload);
    } catch (_) {
      return;
    }

    try {
      const settingsPayload = await apiRequest('/api/settings');
      settings = settingsPayload?.data || null;
    } catch (error) {
      // Non-admin roles may not have settings write/read access.
      settings = null;
    }

    applyBranding(settings, user);

    if (settings && settings.isOnboardingComplete !== true) {
      const updated = await showOnboardingModal(settings, user);
      applyBranding(updated, user);
      if (window.LabUi && typeof window.LabUi.alert === 'function') {
        await window.LabUi.alert('Lab setup saved successfully.', { title: 'Setup Complete' });
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initialize().catch((error) => {
      console.error('Lab onboarding initialization failed:', error);
    });
  });
})();
