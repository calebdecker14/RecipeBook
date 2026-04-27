const token = localStorage.getItem("token");

//  Toggle expandable sections
function toggleSection(btn) {
    const section = btn.nextElementSibling;
    section.classList.toggle("hidden");

    btn.textContent = section.classList.contains("hidden")
        ? btn.textContent.replace("▲", "▼")
        : btn.textContent.replace("▼", "▲");
}

//  Render ONE recipe (reusable everywhere later)
function renderRecipe(r) {
    let ingredientsHTML = "";

    if (r.ingredients && r.ingredients.length > 0) {
        ingredientsHTML = r.ingredients.map((i, index) => `
            <label>
                <input type="checkbox" id="ing-${r.id}-${index}" />
                ${i.amount || ""} ${i.name || ""}
            </label><br/>
        `).join("");
    } else {
        ingredientsHTML = "<p>No ingredients listed</p>";
    }

    let instructionsHTML = r.instructions
        ? `<p>${r.instructions.replace(/\n/g, "<br/>")}</p>`
        : "<p>No instructions provided</p>";

    return `
        <div class="recipe" id="recipe-${r.id}">
            <h3>${r.title}</h3>

            <!-- DESCRIPTION -->
            <p>${r.description}</p>

            <!-- INGREDIENTS -->
            <button onclick="toggleSection(this)">Ingredients ▼</button>
            <div class="section-content hidden">
                ${ingredientsHTML}
            </div>

            <!-- INSTRUCTIONS -->
            <button onclick="toggleSection(this)">Instructions ▼</button>
            <div class="section-content hidden">
                ${instructionsHTML}
            </div>

            <!-- ACTION BUTTONS -->
            <div>
                <button onclick="editRecipe(${r.id})">Edit</button>
                <button onclick="deleteRecipe(${r.id})">Delete</button>
            </div>

            <!-- COMMENTS -->
            <div>
                <textarea id="comment-${r.id}" placeholder="Write a comment..."></textarea>
                <button onclick="postComment(${r.id})">Comment</button>
            </div>

            <!-- RATINGS -->
            <div>
                <span onclick="rateRecipe(${r.id},1)">⭐</span>
                <span onclick="rateRecipe(${r.id},2)">⭐</span>
                <span onclick="rateRecipe(${r.id},3)">⭐</span>
                <span onclick="rateRecipe(${r.id},4)">⭐</span>
                <span onclick="rateRecipe(${r.id},5)">⭐</span>
            </div>
        </div>
    `;
}

//  Load recipes
async function loadRecipes() {
    const res = await fetch("http://localhost:3000/recipes/my", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const recipes = await res.json();

    const container = document.getElementById("recipes");
    container.innerHTML = "";

    recipes.forEach(r => {
        container.innerHTML += renderRecipe(r);
    });
}

//  Edit
function editRecipe(id) {
    window.location.href = `editRecipe.html?id=${id}`;
}

//  Delete
async function deleteRecipe(id) {
    if (!confirm("Delete recipe?")) return;

    try {
        const res = await fetch(`http://localhost:3000/recipes/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (res.ok) {
            const el = document.getElementById(`recipe-${id}`);
            if (el) el.remove();
        } else {
            const err = await res.json().catch(() => ({}));
            alert(`Failed to delete: ${err.error || res.status}`);
        }
    } catch (e) {
        console.error('deleteRecipe error:', e);
        alert('Network error while deleting recipe.');
    }
}

//  Comment
async function postComment(recipeId) {
    const commentBox = document.getElementById(`comment-${recipeId}`);
    const comment = commentBox.value;

    if (!comment.trim()) {
        alert("Please enter a comment.");
        return;
    }

    await fetch("http://localhost:3000/comments", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ recipeId, comment })
    });

    commentBox.value = "";
    alert("Comment posted");
}

//  Rating
async function rateRecipe(recipeId, rating) {
    await fetch("http://localhost:3000/ratings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ recipeId, rating })
    });

    alert("Rating submitted");
}

//  Init
document.addEventListener("DOMContentLoaded", () => {
    loadRecipes();

    const createBtn = document.getElementById("create-recipe-btn");

    if (createBtn) {
        createBtn.onclick = () => {
            window.location.href = "createRecipe.html";
        };
    }
});