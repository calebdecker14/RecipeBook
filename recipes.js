const token = localStorage.getItem("token");

async function loadRecipes() {

    // Fetch only recipes created by the logged-in user
    const res = await fetch("http://localhost:3000/recipes/my", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const recipes = await res.json();

    const container = document.getElementById("recipes");
    container.innerHTML = "";

    const user = JSON.parse(localStorage.getItem("user")) || {};

    recipes.forEach(r => {

        let buttons = "";

        // For now, show edit/delete buttons for all recipes (since this is "My Recipes" page)
        buttons = `
            <button onclick="editRecipe(${r.id})">Edit</button>
            <button onclick="deleteRecipe(${r.id})">Delete</button>
        `;

        container.innerHTML += `
            <div class="recipe" id="recipe-${r.id}">
                <h3>${r.title}</h3>
                <p>${r.description}</p>
                ${buttons}

                <div>
                    <textarea id="comment-${r.id}" placeholder="Write a comment..."></textarea>
                    <button onclick="postComment(${r.id})">Comment</button>
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

}

function editRecipe(id) {
    window.location.href = `editRecipe.html?id=${id}`;
}

async function deleteRecipe(id) {

    if (!confirm("Delete recipe?")) return;

    await fetch(`http://localhost:3000/recipes/${id}`, {
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

document.addEventListener("DOMContentLoaded", () => {

    loadRecipes();

    const createBtn = document.getElementById("create-recipe-btn");

    if (createBtn) {
        createBtn.onclick = () => {
            window.location.href = "createRecipe.html";
        };
    }

});