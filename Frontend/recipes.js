const token = localStorage.getItem("token");

async function loadRecipes() {

    const res = await fetch("/api/recipes", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const recipes = await res.json();

    const container = document.getElementById("recipes");
    container.innerHTML = "";

    const user = JSON.parse(localStorage.getItem("user"));

    recipes.forEach(r => {

        let buttons = "";

        if (user && user.id === r.user_id) {
            buttons = `
                <button onclick="editRecipe(${r.recipe_id})">Edit</button>
                <button onclick="deleteRecipe(${r.recipe_id})">Delete</button>
            `;
        }

        container.innerHTML += `
            <div class="recipe" id="recipe-${r.recipe_id}">
                <h3>${r.title}</h3>
                <p>${r.description}</p>
                ${buttons}

                <div>
                    <textarea id="comment-${r.recipe_id}" placeholder="Write a comment..."></textarea>
                    <button onclick="postComment(${r.recipe_id})">Comment</button>
                </div>

                <div>
                    <span onclick="rateRecipe(${r.recipe_id},1)">⭐</span>
                    <span onclick="rateRecipe(${r.recipe_id},2)">⭐</span>
                    <span onclick="rateRecipe(${r.recipe_id},3)">⭐</span>
                    <span onclick="rateRecipe(${r.recipe_id},4)">⭐</span>
                    <span onclick="rateRecipe(${r.recipe_id},5)">⭐</span>
                </div>
            </div>
        `;
    });

}

function editRecipe(id) {
    window.location.href = `editRecipe.html?id=${id}`;
}

async function deleteRecipe(id) {

    if (!confirm("Delete recipe?")) return;

    await fetch(`/api/recipes/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    document.getElementById(`recipe-${id}`).remove();
}

async function postComment(recipeId) {

    const commentBox = document.getElementById(`comment-${recipeId}`);
    const comment = commentBox.value;

    if (!comment.trim()) {
        alert("Please enter a comment.");
        return;
    }

    await fetch("/api/comments", {
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

async function rateRecipe(recipeId, rating) {

    await fetch("/api/ratings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ recipeId, rating })
    });

    alert("Rating submitted");
}

document.addEventListener("DOMContentLoaded", () => {

    loadRecipes();

    const createBtn = document.getElementById("create-recipe-btn");

    if (createBtn) {
        createBtn.onclick = () => {
            window.location.href = "createRecipe.html";
        };
    }

});