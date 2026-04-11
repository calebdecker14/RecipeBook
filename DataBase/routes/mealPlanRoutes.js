// -------- GLOBALS --------
let draggedRecipeId = null;
let draggedRecipeTitle = null;
let draggedRecipeImage = null;

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// store all recipes so we can look them up when loading saved plans
window.allRecipes = [];

// -------- INITIALIZE PAGE --------
document.addEventListener("DOMContentLoaded", () => {
    generateCalendar();
    loadRecipes();
    setupSearch();

    const prevBtn = document.getElementById("prevMonth");
    const nextBtn = document.getElementById("nextMonth");

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener("click", () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            generateCalendar();
            loadSavedMealPlan(); // re-render saved items for new month
        });

        nextBtn.addEventListener("click", () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            generateCalendar();
            loadSavedMealPlan(); // re-render saved items for new month
        });
    }
});

// -------- GENERATE CALENDAR --------
function generateCalendar() {
    const calendarGrid = document.getElementById("calendarGrid");
    const monthLabel = document.getElementById("monthLabel");
    calendarGrid.innerHTML = "";

    const today = new Date();
    const year = currentYear;
    const month = currentMonth;

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    monthLabel.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // blank cells for alignment
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("calendar-day", "empty");
        calendarGrid.appendChild(emptyCell);
    }

    // actual days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement("div");
        dayCell.classList.add("calendar-day");
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        dayCell.dataset.date = dateStr;

        const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

        if (isToday) {
            dayCell.classList.add("today");
        }

        dayCell.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="day-recipes"></div>
        `;

        dayCell.addEventListener("dragover", (e) => e.preventDefault());
        dayCell.addEventListener("drop", (e) => handleDrop(e, dayCell));

        calendarGrid.appendChild(dayCell);
    }
}

// -------- IMAGE URL FIXER --------
function resolveImageUrl(imageUrl) {
    if (!imageUrl) return "";
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    return `http://localhost:3000${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}

// -------- LOAD RECIPES --------
async function loadRecipes() {
    const recipeList = document.getElementById("recipeList");
    recipeList.innerHTML = "Loading recipes...";

    try {
        const response = await fetch("http://localhost:3000/recipes");
        const recipes = await response.json();

        window.allRecipes = recipes;
        recipeList.innerHTML = "";

        recipes.forEach(recipe => {
            const item = document.createElement("div");
            item.classList.add("recipe-item");
            item.draggable = true;

            const imgUrl = resolveImageUrl(recipe.imageUrl || recipe.image_url);

            item.addEventListener("dragstart", () => {
                draggedRecipeId = recipe.id;
                draggedRecipeTitle = recipe.title;
                draggedRecipeImage = imgUrl;
            });

            item.innerHTML = `
                <img src="${imgUrl}" alt="${recipe.title}">
                <span class="recipe-title">${recipe.title}</span>
            `;

            recipeList.appendChild(item);
        });

        // once recipes are loaded, load saved meal plan
        loadSavedMealPlan();

    } catch (error) {
        recipeList.innerHTML = "Failed to load recipes.";
        console.error("Error loading recipes:", error);
    }
}

// -------- HANDLE DROP ON CALENDAR DAY --------
function handleDrop(event, dayCell) {
    if (!draggedRecipeId) return;

    removeDraggedTag();

    const container = dayCell.querySelector(".day-recipes");
    const dateStr = dayCell.dataset.date;

    const recipeTag = document.createElement("div");
    recipeTag.classList.add("calendar-recipe-tag");
    recipeTag.draggable = true;

    recipeTag.dataset.id = draggedRecipeId;
    recipeTag.dataset.title = draggedRecipeTitle;
    recipeTag.dataset.image = draggedRecipeImage;
    recipeTag.dataset.date = dateStr;

    recipeTag.innerHTML = `
        <img src="${draggedRecipeImage}" alt="">
        <span>${draggedRecipeTitle}</span>
    `;

    recipeTag.addEventListener("dragstart", () => {
        setTimeout(() => recipeTag.classList.add("being-dragged"), 0);

        draggedRecipeId = recipeTag.dataset.id;
        draggedRecipeTitle = recipeTag.dataset.title;
        draggedRecipeImage = recipeTag.dataset.image;
    });

    recipeTag.addEventListener("dragend", () => {
        const stillDragging = document.querySelector(".being-dragged");
        if (stillDragging) {
            const d = stillDragging.dataset.date;
            const rId = stillDragging.dataset.id;
            if (d && rId) {
                deleteMealPlan(d, rId);
            }
            stillDragging.remove();
        }
    });

    container.appendChild(recipeTag);

    // save to backend
    saveMealPlan(dateStr, draggedRecipeId);

    draggedRecipeId = null;
}

// -------- REMOVE TAG WHEN DRAGGED OFF --------
function removeDraggedTag() {
    const tags = document.querySelectorAll(".being-dragged");
    tags.forEach(tag => tag.remove());
}

// -------- SEARCH FILTER --------
function setupSearch() {
    const searchInput = document.getElementById("recipeSearch");

    searchInput.addEventListener("input", () => {
        const filter = searchInput.value.toLowerCase();
        const items = document.querySelectorAll(".recipe-item");

        items.forEach(item => {
            const title = item.innerText.toLowerCase();
            item.style.display = title.includes(filter) ? "flex" : "none";
        });
    });
}

// -------- SAVE MEAL PLAN TO BACKEND --------
async function saveMealPlan(date, recipeId) {
    try {
        await fetch("http://localhost:3000/mealplan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, recipeId })
        });
    } catch (error) {
        console.error("Error saving meal plan:", error);
    }
}

// -------- DELETE MEAL PLAN FROM BACKEND --------
async function deleteMealPlan(date, recipeId) {
    try {
        await fetch("http://localhost:3000/mealplan", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, recipeId })
        });
    } catch (error) {
        console.error("Error deleting meal plan:", error);
    }
}

// -------- LOAD SAVED MEAL PLAN FOR CURRENT USER --------
async function loadSavedMealPlan() {
    try {
        const res = await fetch("http://localhost:3000/mealplan/my");
        const saved = await res.json();

        const year = currentYear;
        const month = currentMonth;

        saved.forEach(entry => {
            // entry.date expected as "YYYY-MM-DD"
            const entryDate = new Date(entry.date);
            if (
                entryDate.getFullYear() !== year ||
                entryDate.getMonth() !== month
            ) {
                return; // skip entries not in current month
            }

            const dateStr = entry.date;
            const dayCell = document.querySelector(`[data-date="${dateStr}"]`);
            if (!dayCell) return;

            const container = dayCell.querySelector(".day-recipes");

            const recipe = window.allRecipes.find(r => String(r.id) === String(entry.recipeId));
            if (!recipe) return;

            const imgUrl = resolveImageUrl(recipe.imageUrl || recipe.image_url);

            const recipeTag = document.createElement("div");
            recipeTag.classList.add("calendar-recipe-tag");
            recipeTag.draggable = true;

            recipeTag.dataset.id = entry.recipeId;
            recipeTag.dataset.title = recipe.title;
            recipeTag.dataset.image = imgUrl;
            recipeTag.dataset.date = dateStr;

            recipeTag.innerHTML = `
                <img src="${imgUrl}" alt="">
                <span>${recipe.title}</span>
            `;

            recipeTag.addEventListener("dragstart", () => {
                setTimeout(() => recipeTag.classList.add("being-dragged"), 0);

                draggedRecipeId = recipeTag.dataset.id;
                draggedRecipeTitle = recipeTag.dataset.title;
                draggedRecipeImage = recipeTag.dataset.image;
            });

            recipeTag.addEventListener("dragend", () => {
                const stillDragging = document.querySelector(".being-dragged");
                if (stillDragging) {
                    const d = stillDragging.dataset.date;
                    const rId = stillDragging.dataset.id;
                    if (d && rId) {
                        deleteMealPlan(d, rId);
                    }
                    stillDragging.remove();
                }
            });

            container.appendChild(recipeTag);
        });

    } catch (error) {
        console.error("Error loading saved meal plan:", error);
    }
}