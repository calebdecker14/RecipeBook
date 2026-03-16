const token = localStorage.getItem("token");

const params = new URLSearchParams(window.location.search);
const recipeId = params.get("id");

async function loadRecipe() {

    const res = await fetch(`/api/recipes/${recipeId}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const recipe = await res.json();

    document.getElementById("title").value = recipe.title;
    document.getElementById("description").value = recipe.description;

}

async function updateRecipe() {

    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;

    await fetch(`/api/recipes/${recipeId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
    });

    alert("Recipe updated!");

    window.location.href = "recipes.html";
}

loadRecipe();