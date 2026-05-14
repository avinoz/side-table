function showSideTableMessage(message) {
  let overlay = document.getElementById("side-table-dialog-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "side-table-dialog-overlay";
    overlay.className = "side-table-dialog-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.innerHTML = `
      <div class="side-table-dialog" role="dialog" aria-modal="true" aria-labelledby="side-table-dialog-title">
        <h2 id="side-table-dialog-title" class="side-table-dialog-title">Side Table</h2>
        <p class="side-table-dialog-message"></p>
        <button type="button" class="side-table-dialog-close">OK</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
    };

    overlay.querySelector(".side-table-dialog-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
    });
  }

  overlay.querySelector(".side-table-dialog-message").innerHTML = message;
  overlay.classList.add("is-open");
  overlay.removeAttribute("aria-hidden");
}

const emailForm = document.getElementById("emailForm");
const surveyForm = document.getElementById("surveyForm");
const GOOGLE_SHEETS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxrxFOSr92H96h9P6A6aUdGN_KDDBGABK2bAoTO1ZIjImsOBD3PFqgIGPzGba1T5lv0/exec";

function sheetsEndpointConfigured() {
  return (
    GOOGLE_SHEETS_WEB_APP_URL &&
    !GOOGLE_SHEETS_WEB_APP_URL.includes("REPLACE_WITH_YOUR_DEPLOYMENT_ID")
  );
}

function setSurveySubmitLoading(isLoading) {
  let el = document.getElementById("survey-submit-overlay");
  if (isLoading) {
    if (!el) {
      el = document.createElement("div");
      el.id = "survey-submit-overlay";
      el.className = "survey-submit-overlay";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.setAttribute("aria-busy", "true");
      el.innerHTML = `
        <div class="survey-submit-overlay-inner">
          <div class="survey-submit-spinner" aria-hidden="true"></div>
          <p class="survey-submit-overlay-text">Sending your responses…</p>
        </div>
      `;
      document.body.appendChild(el);
    }
    el.classList.add("is-visible");
    document.documentElement.classList.add("survey-submit-loading");
  } else {
    if (el) {
      el.classList.remove("is-visible");
      el.setAttribute("aria-busy", "false");
    }
    document.documentElement.classList.remove("survey-submit-loading");
  }
}

if (emailForm) {
  emailForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(emailForm);
    const email = (formData.get("email") || "").toString().trim().toLowerCase();

    if (!email) {
      return;
    }

    const submittedAt = new Date().toISOString();
    const payload = {
      submissionType: "email",
      email,
      submittedAt,
    };

    if (sheetsEndpointConfigured()) {
      try {
        const submitResponse = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify(payload),
        });

        if (!submitResponse.ok) {
          throw new Error("Failed to submit email to Google Sheets.");
        }
      } catch (error) {
        showSideTableMessage(
          "We could not save your email right now. Please try again."
        );
        return;
      }
    } else {
      const emailLeads = JSON.parse(localStorage.getItem("sideTableEmailLeads") || "[]");
      emailLeads.push({ email, submittedAt });
      localStorage.setItem("sideTableEmailLeads", JSON.stringify(emailLeads));
    }

    emailForm.reset();
    showSideTableMessage("We will keep you updated with our progress!");
  });
}

if (surveyForm) {
  surveyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = surveyForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    setSurveySubmitLoading(true);
    try {
      const formData = new FormData(surveyForm);

      const response = {
        submissionType: "survey",
        drinkerType: (formData.get("drinkerType") || "").toString(),
        drinksOrdered: formData.getAll("drinksOrdered"),
        teasLoved: formData.getAll("teasLoved"),
        breakfastItems: formData.getAll("breakfastItems"),
        lunchItems: formData.getAll("lunchItems"),
        cakeFlavors: formData.getAll("cakeFlavors"),
        favoriteShops: (formData.get("favoriteShops") || "").toString().trim(),
        dietaryRestrictions: (formData.get("dietaryRestrictions") || "").toString().trim(),
        cafeElse: (formData.get("cafeElse") || "").toString().trim(),
        contactInfo: (formData.get("contactInfo") || "").toString().trim(),
        submittedAt: new Date().toISOString(),
      };

      if (sheetsEndpointConfigured()) {
        try {
          const submitResponse = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
            method: "POST",
            headers: {
              "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify(response),
          });

          if (!submitResponse.ok) {
            throw new Error("Failed to submit survey to Google Sheets.");
          }
        } catch (error) {
          showSideTableMessage(
            "Darn, we're having some technical difficulties. Please try again."
          );
          return;
        }
      } else {
        const surveyResponses = JSON.parse(
          localStorage.getItem("sideTableSurveyResponses") || "[]"
        );
        surveyResponses.push(response);
        localStorage.setItem("sideTableSurveyResponses", JSON.stringify(surveyResponses));
      }

      surveyForm.reset();
      showSideTableMessage(
        "Thanks for your opinion! We'll try to incorporate them!"
      );
    } finally {
      setSurveySubmitLoading(false);
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

(function initSiteNavDrawer() {
  const toggle = document.getElementById("siteNavToggle");
  const drawer = document.getElementById("siteNavDrawer");
  const closeBtn = document.getElementById("siteNavDrawerClose");
  const backdrop = document.getElementById("siteNavDrawerBackdrop");
  const source = document.getElementById("primaryNavList");
  const target = document.getElementById("primaryNavDrawerList");

  if (!toggle || !drawer || !closeBtn || !backdrop || !source || !target) {
    return;
  }

  const mq = window.matchMedia("(max-width: 640px)");

  function copyNavIntoDrawer() {
    target.innerHTML = "";
    source.querySelectorAll("li").forEach((li) => {
      target.appendChild(li.cloneNode(true));
    });
  }

  function isMobileNav() {
    return mq.matches;
  }

  let previouslyFocused = null;

  function openDrawer() {
    if (!isMobileNav()) return;
    copyNavIntoDrawer();
    previouslyFocused = document.activeElement;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("site-nav-drawer-open");
    closeBtn.focus();
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("site-nav-drawer-open");
    if (previouslyFocused && typeof previouslyFocused.focus === "function") {
      previouslyFocused.focus();
    }
  }

  function onToggleClick() {
    if (drawer.classList.contains("is-open")) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  copyNavIntoDrawer();

  mq.addEventListener("change", () => {
    if (!isMobileNav()) {
      closeDrawer();
    }
  });

  window.addEventListener("resize", () => {
    if (!isMobileNav()) {
      closeDrawer();
    }
  });

  toggle.addEventListener("click", onToggleClick);
  closeBtn.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.classList.contains("is-open")) {
      closeDrawer();
    }
  });

  target.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link && link.getAttribute("href")) {
      closeDrawer();
    }
  });
})();

(function initHomeReveal() {
  const roots = document.querySelectorAll(".page--home, .page--store");
  if (!roots.length) return;

  const revealSelector = ".reveal-h2, .reveal-img";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion) {
    const reveals = [];
    roots.forEach((root) => {
      root.querySelectorAll(revealSelector).forEach((el) => reveals.push(el));
    });
    if (!reveals.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    roots.forEach((root) => {
      root.querySelectorAll(revealSelector).forEach((el) => el.classList.add("is-visible"));
    });
  }
})();

const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    contactForm.reset();
    showSideTableMessage("Thanks — we'll get back to you soon.");
  });
}
