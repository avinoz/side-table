const emailForm = document.getElementById("emailForm");
const surveyForm = document.getElementById("surveyForm");

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
    alert("Thanks for joining! We will keep you posted about opening day.");
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
        alert("Please select only your top 2 coffee drinks.");
      }
    });
  });

  surveyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(surveyForm);
    const topCoffeeDrinks = formData.getAll("topCoffeeDrinks");

    if (topCoffeeDrinks.length !== 2) {
      alert("Please select exactly 2 coffee drinks before submitting.");
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

    const surveyResponses = JSON.parse(
      localStorage.getItem("sideTableSurveyResponses") || "[]"
    );
    surveyResponses.push(response);
    localStorage.setItem("sideTableSurveyResponses", JSON.stringify(surveyResponses));

    surveyForm.reset();
    alert("Survey submitted. Thank you for helping shape Side Table.");
  });
}
