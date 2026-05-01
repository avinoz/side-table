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

  overlay.querySelector(".side-table-dialog-message").textContent = message;
  overlay.classList.add("is-open");
  overlay.removeAttribute("aria-hidden");
}

const emailForm = document.getElementById("emailForm");
const surveyForm = document.getElementById("surveyForm");
const GOOGLE_SHEETS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycby5rN7k-qqvHTuOr5ULuYdmP_Wk50MsqKF-59qahR1wLXDNF4jpZ_Wha_NrzsMFgPysKw/exec";

function sheetsEndpointConfigured() {
  return (
    GOOGLE_SHEETS_WEB_APP_URL &&
    !GOOGLE_SHEETS_WEB_APP_URL.includes("REPLACE_WITH_YOUR_DEPLOYMENT_ID")
  );
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
  });
}
