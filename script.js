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
const SURVEY_SHEET_ENDPOINT =
  "https://script.google.com/macros/s/AKfycby5rN7k-qqvHTuOr5ULuYdmP_Wk50MsqKF-59qahR1wLXDNF4jpZ_Wha_NrzsMFgPysKw/exec";

if (emailForm) {
  emailForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(emailForm);
    const email = (formData.get("email") || "").toString().trim().toLowerCase();

    if (!email) {
      return;
    }

    const emailLeads = JSON.parse(localStorage.getItem("sideTableEmailLeads") || "[]");
    emailLeads.push({ email, submittedAt: new Date().toISOString() });
    localStorage.setItem("sideTableEmailLeads", JSON.stringify(emailLeads));

    emailForm.reset();
    showSideTableMessage("We will keep you updated with our progress!");
  });
}

if (surveyForm) {
  const topCoffeeDrinkBoxes = surveyForm.querySelectorAll(
    "input[name='topCoffeeDrinks']"
  );

  topCoffeeDrinkBoxes.forEach((box) => {
    box.addEventListener("change", () => {
      const checked = surveyForm.querySelectorAll(
        "input[name='topCoffeeDrinks']:checked"
      );
      if (checked.length > 2) {
        box.checked = false;
        showSideTableMessage("Please select only your top 2 coffee drinks.");
      }
    });
  });

  surveyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(surveyForm);
    const topCoffeeDrinks = formData.getAll("topCoffeeDrinks");

    if (topCoffeeDrinks.length !== 2) {
      showSideTableMessage("Please select exactly 2 coffee drinks before submitting.");
      return;
    }

    const response = {
      primaryDrinker: formData.get("primaryDrinker"),
      topCoffeeDrinks,
      favoriteTeaLeaves: formData.getAll("favoriteTeaLeaves"),
      favoriteCakesFrom: (formData.get("favoriteCakesFrom") || "").toString().trim(),
      favoriteFoodCategory: formData.get("favoriteFoodCategory"),
      favoriteFoodCustom: (formData.get("favoriteFoodCustom") || "").toString().trim(),
      submittedAt: new Date().toISOString(),
    };

    const hasConfiguredSheetEndpoint =
      SURVEY_SHEET_ENDPOINT &&
      !SURVEY_SHEET_ENDPOINT.includes("REPLACE_WITH_YOUR_DEPLOYMENT_ID");

    if (hasConfiguredSheetEndpoint) {
      try {
        const submitResponse = await fetch(SURVEY_SHEET_ENDPOINT, {
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
