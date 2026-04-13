const token = localStorage.getItem("token");

// LOAD USER RECIPES
async function loadRecipes() {
    try {
        const res = await fetch("http://localhost:3000/recipes/my", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error("Failed to load recipes");
        }

        const recipes = await res.json();

        const container = document.getElementById("feed");
        container.innerHTML = "";

        if (!recipes.length) {
            container.innerHTML = "<p>No recipes uploaded yet.</p>";
            return;
        }

        recipes.forEach(r => {
            let ingredientsHTML = "<p>No ingredients listed</p>";
            let instructionsHTML = "<p>No instructions listed</p>";

            // Parse ingredients safely
            try {
                const ingredients = r.ingredients
                    ? typeof r.ingredients === "string"
                        ? JSON.parse(r.ingredients)
                        : r.ingredients
                    : [];

                if (ingredients.length > 0) {
                    ingredientsHTML = ingredients
                        .map(item => `
                            <div class="ingredient-row">
                                <input type="checkbox" ${item.checked ? "checked" : ""} disabled>
                                <span>${item.name}</span>
                            </div>
                        `)
                        .join("");
                }
            } catch (err) {
                console.error("Ingredient parse error:", err);
            }

            // Parse instructions safely
            try {
                const instructions = r.instructions
                    ? typeof r.instructions === "string"
                        ? JSON.parse(r.instructions)
                        : r.instructions
                    : [];

                if (instructions.length > 0) {
                    instructionsHTML = instructions
                        .map((step, index) => `
                            <p><strong>Step ${index + 1}:</strong> ${step}</p>
                        `)
                        .join("");
                }
            } catch (err) {
                console.error("Instruction parse error:", err);
            }

            container.innerHTML += `
                <div class="recipe card" id="recipe-${r.id}">
                    <h3>${r.title}</h3>

                    <p><strong>Description:</strong> ${r.description}</p>

                    <p><strong>Estimated Time:</strong> ${r.estimated_time || "Not specified"}</p>

                    <details class="expand-section">
                        <summary>Ingredients</summary>
                        ${ingredientsHTML}
                    </details>

                    <details class="expand-section">
                        <summary>Instructions</summary>
                        ${instructionsHTML}
                    </details>

                    <button onclick="editRecipe(${r.id})">Edit</button>
                    <button onclick="deleteRecipe(${r.id})">Delete</button>

                    <div>
                        <textarea
                            id="comment-${r.id}"
                            placeholder="Write a comment..."></textarea>
                        <button onclick="postComment(${r.id})">
                            Comment
                        </button>
                    </div>

                    <div>
                        <span onclick="rateRecipe(${r.id},1)">⭐</span>
                        <span onclick="rateRecipe(${r.id},2)">⭐</span>
                        <span onclick="rateRecipe(${r.id},3)">⭐</span>
                        <span onclick="rateRecipe(${r.id},4)">⭐</span>
                        <span onclick="rateRecipe(${r.id},5)">⭐</span>
                    </div>
                </div>
            `;
        });

    } catch (err) {
        console.error("Load recipes error:", err);
        alert("Failed to load recipes.");
    }
}

// EDIT
function editRecipe(id) {
    window.location.href = `editRecipe.html?id=${id}`;
}

// DELETE
async function deleteRecipe(id) {
    if (!confirm("Delete recipe?")) return;

    try {
        const res = await fetch(`http://localhost:3000/recipes/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error("Delete failed");
        }

        document.getElementById(`recipe-${id}`).remove();

    } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete recipe.");
    }
}

// COMMENT
async function postComment(recipeId) {
    const commentBox = document.getElementById(`comment-${recipeId}`);
    const comment = commentBox.value;

    if (!comment.trim()) {
        alert("Please enter a comment.");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/comments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ recipeId, comment })
        });

        if (!res.ok) {
            throw new Error("Comment failed");
        }

        commentBox.value = "";
        alert("Comment posted");

    } catch (err) {
        console.error("Comment error:", err);
        alert("Failed to post comment.");
    }
}

// RATE
async function rateRecipe(recipeId, rating) {
    try {
        const res = await fetch("http://localhost:3000/ratings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ recipeId, rating })
        });

        if (!res.ok) {
            throw new Error("Rating failed");
        }

        alert("Rating submitted");

    } catch (err) {
        console.error("Rating error:", err);
        alert("Failed to submit rating.");
    }
}

// PAGE LOAD
window.onload = function () {
    loadRecipes();

    const uploadBtn = document.getElementById("showCreate");
    const createForm = document.getElementById("createForm");
    const cancelBtn = document.getElementById("cancelCreate");

    console.log("Upload button:", uploadBtn);
    console.log("Create form:", createForm);

    if (uploadBtn) {
        uploadBtn.addEventListener("click", function () {
            console.log("Upload clicked");
            createForm.style.display = "block";
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", function () {
            createForm.style.display = "none";
        });
    }
};