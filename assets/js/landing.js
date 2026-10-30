/* Hearth promo — вопрос → поворот → следующий вопрос.
   Продукт — sticky-предмет, который поворачивается по мере прокрутки. */

(() => {
  'use strict';

  const FRAMES = 24;
  const TARGETS = [0, 5, 10, 15, 23];
  const SCENES = [
    {
      q: 'Где ваши фото, если они в трёх телефонах и двух облаках?',
      cta: 'А что это?'
    },
    {
      q: 'Память закончилась, а подписка просит ещё?',
      cta: 'Хранить'
    },
    {
      q: 'Сырьё не влезает в ноутбук, а ждать загрузку — нет времени?',
      cta: 'Работать'
    },
    {
      q: 'Три человека, один проект — и никто не хочет быть сисадмином?',
      cta: 'Пригласить'
    },
    {
      q: 'Кому на самом деле принадлежит ваша память?',
      cta: 'Изучить'
    }
  ];

  const experience = document.getElementById('experience');
  const product = document.getElementById('product');
  const stage = experience.querySelector('.stage');
  const ask = experience.querySelector('.ask');
  const question = experience.querySelector('[data-question]');
  const counter = experience.querySelector('[data-counter]');
  const live = experience.querySelector('[data-live]');
  const ghost = experience.querySelector('[data-to-product]');
  const big = experience.querySelector('[data-cta-big]');
  const small = experience.querySelector('[data-cta-small]');
  const smallLabel = experience.querySelector('[data-cta-label]');
  const progress = document.querySelector('[data-progress]');
  const skip = document.querySelector('.skip');
  const glows = Array.from(document.querySelectorAll('[data-glow]'));
  const device = experience.querySelector('.device');
  const canvas = experience.querySelector('.device__canvas');
  const fallback = experience.querySelector('.device__fallback');
  const ctx = canvas.getContext('2d');
  const morph = document.querySelector('[data-morph]');
  const morphCanvas = morph.querySelector('.morph__canvas');
  const morphCtx = morphCanvas.getContext('2d');

  const productCanvas = product.querySelector('.p-aside__canvas');
  const productFallback = product.querySelector('.p-aside__fallback');
  const productCtx = productCanvas.getContext('2d');
  const asideLabel = product.querySelector('[data-aside-label]');
  const asideDevice = product.querySelector('.p-aside__device');
  const productSections = Array.from(product.querySelectorAll('[data-frame]'));

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let index = 0;
  let shownFrame = 0;
  let busy = false;
  let screen = 'experience';
  let screenBusy = false;
  let productReveals = null;

  let productFrame = 0;
  let productTarget = 0;
  let productSpin = 0;
  let scrollRaf = 0;
  let labelTimer = 0;
  let morphFrame = 0;
  let morphSpin = 0;

  /* ── Кадры ─────────────────────────────────────────────────────── */

  const images = Array.from({ length: FRAMES }, (_, i) => {
    const img = new Image();
    img.src = `assets/turn/${String(i).padStart(2, '0')}.webp`;
    img.onload = () => {
      if (i === shownFrame) drawExperience(i);
      if (screen === 'product' && i === productFrame) drawProduct(i);
      if (!morph.hidden && i === morphFrame) drawMorph(i);
    };
    return img;
  });

  function draw(targetCtx, targetCanvas, i, targetFallback) {
    const img = images[i];
    if (!targetCtx || !img || !img.naturalWidth) return;
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    targetCtx.drawImage(img, 0, 0, targetCanvas.width, targetCanvas.height);
    if (targetFallback) targetFallback.hidden = true;
  }

  function drawExperience(i) {
    draw(ctx, canvas, i, fallback);
  }

  function drawProduct(i) {
    draw(productCtx, productCanvas, i, productFallback);
  }

  function drawMorph(i) {
    if (morphCtx && images[i] && images[i].naturalWidth) {
      morphCtx.clearRect(0, 0, morphCanvas.width, morphCanvas.height);
      morphCtx.drawImage(images[i], 0, 0, morphCanvas.width, morphCanvas.height);
    }
  }

  function animateMorphFrames(from, to, duration) {
    cancelAnimationFrame(morphSpin);
    let delta = to - from;
    if (delta > 12) delta -= FRAMES;
    if (delta < -12) delta += FRAMES;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      const frame = ((Math.round(from + delta * eased) % FRAMES) + FRAMES) % FRAMES;
      if (frame !== morphFrame) {
        morphFrame = frame;
        drawMorph(frame);
      }
      if (t < 1) morphSpin = requestAnimationFrame(tick);
      else {
        morphFrame = ((from + delta) % FRAMES + FRAMES) % FRAMES;
        drawMorph(morphFrame);
      }
    };
    morphSpin = requestAnimationFrame(tick);
  }

  function turnTo(target, duration) {
    if (reduced() || duration < 20) {
      shownFrame = target;
      drawExperience(shownFrame);
      return;
    }
    const start = shownFrame;
    const delta = (target - start + FRAMES) % FRAMES;
    if (!delta) return;
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      const frame = Math.round(start + delta * eased) % FRAMES;
      if (frame !== shownFrame) {
        shownFrame = frame;
        drawExperience(shownFrame);
      }
      if (t < 1) requestAnimationFrame(tick);
      else {
        shownFrame = (start + delta) % FRAMES;
        drawExperience(shownFrame);
      }
    };
    requestAnimationFrame(tick);
  }

  function spinProduct(target) {
    productTarget = target;
    if (reduced()) {
      productFrame = ((target % FRAMES) + FRAMES) % FRAMES;
      drawProduct(productFrame);
      return;
    }
    cancelAnimationFrame(productSpin);
    const start = productFrame;
    let delta = target - start;
    if (delta > 12) delta -= FRAMES;
    if (delta < -12) delta += FRAMES;
    if (!delta) return;
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / 620);
      const eased = 1 - Math.pow(1 - t, 4);
      const frame = ((Math.round(start + delta * eased) % FRAMES) + FRAMES) % FRAMES;
      if (frame !== productFrame) {
        productFrame = frame;
        drawProduct(productFrame);
      }
      if (t < 1) productSpin = requestAnimationFrame(tick);
      else {
        productFrame = ((start + delta) % FRAMES + FRAMES) % FRAMES;
        drawProduct(productFrame);
      }
    };
    productSpin = requestAnimationFrame(tick);
  }

  /* ── Свет, счётчик, прогресс ───────────────────────────────────── */

  function setGlow(value) {
    glows.forEach((layer) => {
      layer.classList.toggle('is-active', layer.dataset.glow === String(value));
    });
  }

  function setProgress(value) {
    progress.style.transform = `scaleX(${value})`;
  }

  function setStep(next, focusNext) {
    index = next;
    experience.dataset.step = next;
    const scene = SCENES[next];
    question.textContent = scene.q;
    counter.textContent = String(next + 1).padStart(2, '0');
    live.textContent = `Вопрос ${next + 1} из 5. ${scene.q}`;
    if (next > 0) smallLabel.textContent = scene.cta;
    setProgress((next + 1) / 5);
    big.tabIndex = next === 0 ? 0 : -1;
    small.tabIndex = next === 0 ? -1 : 0;
    if (next === 0) {
      big.removeAttribute('aria-hidden');
      small.setAttribute('aria-hidden', 'true');
    } else {
      small.removeAttribute('aria-hidden');
      if (focusNext) small.focus({ preventScroll: true });
      big.setAttribute('aria-hidden', 'true');
    }
    if (next === 0) ghost.classList.remove('is-gone');
    else ghost.classList.add('is-gone');
  }

  function goTo(next, focusNext) {
    if (busy || next < 0 || next > 4 || next === index) return;
    busy = true;
    experience.classList.add('is-turning');
    ask.classList.add('is-changing');
    small.classList.add('is-changing');
    ghost.classList.add('is-gone');
    setGlow(next);
    turnTo(TARGETS[next], reduced() ? 0 : 560);

    const delay = reduced() ? 0 : 190;
    window.setTimeout(() => {
      setStep(next, focusNext);
      requestAnimationFrame(() => {
        ask.classList.remove('is-changing');
        small.classList.remove('is-changing');
      });
    }, delay);

    window.setTimeout(() => {
      experience.classList.remove('is-turning');
      busy = false;
    }, reduced() ? 0 : 760);
  }

  function restartQuestions() {
    index = 0;
    shownFrame = 0;
    setStep(0, false);
    setGlow(0);
    setProgress(0.2);
    drawExperience(0);
    ghost.classList.remove('is-gone');
  }

  /* ── Продукт: sticky-предмет и подписи ─────────────────────────── */

  function setAsideLabel(text) {
    if (!asideLabel || asideLabel.textContent === text) return;
    asideLabel.textContent = text;
    asideLabel.classList.remove('is-changing');
    void asideLabel.offsetWidth;
    asideLabel.classList.add('is-changing');
    window.clearTimeout(labelTimer);
    labelTimer = window.setTimeout(() => asideLabel.classList.remove('is-changing'), 280);
  }

  function revealProduct() {
    if (!productReveals) {
      productReveals = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            productReveals.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      product.querySelectorAll('.reveal').forEach((el) => productReveals.observe(el));
    }
    product.querySelectorAll('.p-hero .reveal').forEach((el) => el.classList.add('in'));
  }

  function activeSection() {
    const line = window.innerHeight * 0.58;
    let active = productSections[0];
    for (const section of productSections) {
      if (section.getBoundingClientRect().top <= line) active = section;
    }
    return active;
  }

  function updateProduct() {
    if (screen !== 'product' || product.hidden) return;
    const active = activeSection();
    if (!active) return;
    const target = Number(active.dataset.frame);
    if (!Number.isNaN(target) && target !== productTarget) spinProduct(target);
    setAsideLabel(active.dataset.label || '');
    const shift = reduced() ? 0 : Math.sin(window.scrollY / 480) * 7;
    asideDevice.style.setProperty('--shift', `${shift}px`);
  }

  function onProductScroll() {
    if (screen !== 'product') return;
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      updateProduct();
    });
  }

  /* ── Переходы ──────────────────────────────────────────────────── */

  function morphProduct(focus) {
    const start = device.getBoundingClientRect();
    const startFrame = shownFrame;

    experience.classList.add('is-morphing');
    document.body.classList.add('is-morphing');
    product.classList.add('is-morphing');
    product.hidden = false;
    window.scrollTo(0, 0);

    productFrame = 0;
    productTarget = 0;
    drawProduct(0);
    if (asideLabel) {
      window.clearTimeout(labelTimer);
      asideLabel.textContent = 'Hearth · 500 ГБ';
      asideLabel.classList.remove('is-changing');
    }
    revealProduct();

    const targetEl = product.querySelector('.p-aside__device');
    const target = targetEl.getBoundingClientRect();
    const scale = target.width ? start.width / target.width : 1;

    morph.style.width = `${target.width}px`;
    morph.style.height = `${target.height}px`;
    morph.style.left = `${target.left}px`;
    morph.style.top = `${target.top}px`;
    morph.style.transform = 'translate(0, 0) scale(1)';
    const startTransform =
      `translate(${start.left - target.left}px, ${start.top - target.top}px) scale(${scale})`;
    morphFrame = startFrame;
    drawMorph(startFrame);
    morph.hidden = false;
    void morph.offsetWidth;

    morph.getAnimations().forEach((animation) => animation.cancel());
    morph.classList.add('is-on');
    requestAnimationFrame(() => {
      product.classList.add('is-in');
    });
    morph.animate(
      [
        { transform: startTransform },
        { transform: 'translate(0, 0) scale(1)' }
      ],
      { duration: 1000, easing: 'cubic-bezier(.33, 0, .15, 1)', fill: 'both' }
    );
    animateMorphFrames(startFrame, 0, 1000);

    window.setTimeout(() => {
      if (screen !== 'product') return;
      experience.classList.add('is-clearing');
    }, 400);

    window.setTimeout(() => {
      if (screen !== 'product') return;
      experience.classList.add('is-leaving');
    }, 650);

    window.setTimeout(() => {
      if (screen !== 'product') return;
      experience.hidden = true;
      experience.classList.remove('is-morphing', 'is-clearing', 'is-leaving');
      document.body.classList.remove('is-morphing');
      cancelAnimationFrame(morphSpin);
      morph.getAnimations().forEach((animation) => animation.cancel());
      morph.classList.remove('is-on');
      morph.hidden = true;
      morph.style.transform = 'translate(0, 0) scale(1)';
      product.classList.remove('is-morphing');
      updateProduct();
      if (focus) {
        const title = product.querySelector('.p-title');
        if (title) title.focus({ preventScroll: true });
      }
      screenBusy = false;
    }, 1100);
  }

  function showProduct(push = true, instant = false, focus = true, enter = false) {
    if (screen === 'product') return;
    screen = 'product';
    setGlow('product');
    setProgress(1);
    skip.hidden = true;
    document.title = 'Hearth и Uno — накануне запуска';
    if (push) pushHash('#product');

    const uncover = () => {
      if (screen !== 'product') return;
      experience.hidden = true;
      product.hidden = false;
      window.scrollTo(0, 0);
      productFrame = 0;
      productTarget = 0;
      drawProduct(0);
      if (asideLabel) {
        window.clearTimeout(labelTimer);
        asideLabel.textContent = 'Hearth · 500 ГБ';
        asideLabel.classList.remove('is-changing');
      }
      revealProduct();
      requestAnimationFrame(() => {
        product.classList.add('is-in');
        updateProduct();
        if (focus) {
          const title = product.querySelector('.p-title');
          if (title) title.focus({ preventScroll: true });
        }
      });
    };

    if (instant) {
      uncover();
      return;
    }

    if (enter) {
      if (reduced()) {
        uncover();
        return;
      }
      morphProduct(focus);
      return;
    }

    screenBusy = true;
    experience.classList.add('is-out');
    window.setTimeout(() => {
      if (screen !== 'product') return;
      uncover();
      screenBusy = false;
    }, reduced() ? 0 : 420);
  }

  function showExperience(push = true, instant = false, focus = true) {
    if (screen === 'experience') return;
    screen = 'experience';
    restartQuestions();
    skip.hidden = false;
    document.title = 'Hearth — дом для ваших данных';
    cancelAnimationFrame(productSpin);
    cancelAnimationFrame(morphSpin);
    if (push) pushHash('#experience');

    const uncover = () => {
      if (screen !== 'experience') return;
      product.hidden = true;
      experience.hidden = false;
      experience.classList.remove('is-out');
      experience.classList.remove('is-morphing', 'is-clearing', 'is-leaving');
      document.body.classList.remove('is-morphing');
      product.classList.remove('is-morphing');
      morph.classList.remove('is-on');
      morph.hidden = true;
      stage.style.transformOrigin = '';
      window.scrollTo(0, 0);
      if (index === 0) ghost.classList.remove('is-gone');
      if (focus) question.focus({ preventScroll: true });
    };

    if (instant) {
      product.classList.remove('is-in');
      uncover();
      return;
    }

    screenBusy = true;
    product.classList.remove('is-in');
    window.setTimeout(() => {
      if (screen !== 'experience') return;
      uncover();
      screenBusy = false;
    }, reduced() ? 0 : 420);
  }

  function syncFromHash() {
    if (location.hash === '#product') showProduct(false);
    else if (location.hash === '#experience' || location.hash === '') showExperience(false);
  }

  /* ── События ────────────────────────────────────────────────────── */

  experience.querySelector('.brand').addEventListener('click', (event) => {
    if (screen !== 'experience' || index === 0) return;
    event.preventDefault();
    restartQuestions();
    question.focus({ preventScroll: true });
  });

  big.addEventListener('click', (event) => goTo(1, event.detail === 0));

  small.addEventListener('click', (event) => {
    if (index < 4) goTo(index + 1, event.detail === 0);
    else showProduct(true, false, true, true);
  });

  ghost.addEventListener('click', () => showProduct(true));

  product.querySelectorAll('[data-back]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      showExperience(true);
    });
  });

  window.addEventListener('scroll', onProductScroll, { passive: true });

  window.addEventListener('popstate', () => {
    if (screenBusy) return;
    syncFromHash();
  });

  function pushHash(hash) {
    try {
      history.pushState({ screen: hash.slice(1) }, '', hash);
    } catch (error) {
      // file:// не всегда разрешает pushState. Экран всё равно работает.
    }
  }

  /* ── Первый кадр ───────────────────────────────────────────────── */

  setStep(0, false);
  setGlow(0);
  setProgress(0.2);

  if (location.hash === '#product') showProduct(false, true, false);
})();
