const AllProducts = "productPageProducts";
let products = JSON.parse(localStorage.getItem(AllProducts)) || [];
let toastTimer;

function getElement(id) {
    return document.getElementById(id);
}

function saveProducts() {
    localStorage.setItem(AllProducts, JSON.stringify(products));
}

function makeId() {
    return Math.floor(Math.random() * 90000) + 10000;
}

function safeImageUrl(value) {
    if (!value) {
        return "";
    }

    try {
        const url = new URL(value);

        if (url.protocol === "http:" || url.protocol === "https:") {
            return url.href;
        }

        return "";
    } catch (error) {
        return "";
    }
}

function formatPrice(price) {
    return Number(price).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    });
}

function showToast(message) {
    const toast = getElement("toast");

    if (!toast) {
        return;
    }

    toast.innerText = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(function() {
        toast.classList.remove("show");
    }, 2600);
}

function showPage(page) {
    const pages = ["view", "add", "edit"];

    if (!pages.includes(page)) {
        return;
    }

    document.querySelectorAll(".page").forEach(function(section) {
        section.classList.remove("active");
    });

    const pageElement = getElement(page + "Page");

    if (!pageElement) {
        return;
    }

    pageElement.classList.add("active");

    document.querySelectorAll(".nav-link").forEach(function(link) {
        link.classList.toggle("active", link.dataset.page === page);
    });

    const titles = {
        view: "View Product",
        add: "Add Product",
        edit: "Edit Product"
    };

    if (getElement("pageHeading")) {
        getElement("pageHeading").innerText = titles[page];
    }

    if (page === "view") {
        renderProducts();
        updateStats();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

document.querySelectorAll(".nav-link").forEach(function(link) {
    link.addEventListener("click", function(event) {
        event.preventDefault();

        const page = link.dataset.page;

        if (page === "edit") {
            cancelEdit();
        }

        showPage(page);
    });
});

function updateStats() {
    if (getElement("totalProducts")) {
        getElement("totalProducts").innerText = products.length;
    }

    const categories = [
        ...new Set(
            products
            .map(function(product) {
                return String(product.category || "").trim().toLowerCase();
            })
            .filter(Boolean)
        )
    ];

    if (getElement("totalCategories")) {
        getElement("totalCategories").innerText = categories.length;
    }

    if (getElement("lowStock")) {
        getElement("lowStock").innerText = products.filter(function(product) {
            return Number(product.quantity) <= 5;
        }).length;
    }

    if (getElement("activeProducts")) {
        getElement("activeProducts").innerText = products.filter(function(product) {
            return product.status === "Active";
        }).length;
    }
}

function updateCategoryFilter() {
    const categoryFilter = getElement("categoryFilter");

    if (!categoryFilter) {
        return;
    }

    const oldValue = categoryFilter.value;

    const categories = [
        ...new Set(
            products
            .map(function(product) {
                return String(product.category || "").trim();
            })
            .filter(Boolean)
        )
    ].sort();

    categoryFilter.innerHTML = '<option value="">All Categories</option>';

    categories.forEach(function(category) {
        const option = document.createElement("option");

        option.value = category;
        option.innerText = category;

        categoryFilter.appendChild(option);
    });

    if (categories.includes(oldValue)) {
        categoryFilter.value = oldValue;
    }
}

function renderProducts() {
    const productSearch = getElement("productSearch");
    const categoryFilter = getElement("categoryFilter");
    const sortFilter = getElement("sortFilter");
    const productTable = getElement("productTable");
    const emptyState = getElement("emptyState");

    if (!productSearch || !categoryFilter || !sortFilter || !productTable || !emptyState) {
        return;
    }

    updateCategoryFilter();

    const search = productSearch.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const sort = sortFilter.value;

    let filteredProducts = products.filter(function(product) {
        const name = String(product.name || "").toLowerCase();
        const productCategory = String(product.category || "");

        return name.includes(search) && (!category || productCategory === category);
    });

    if (sort === "low") {
        filteredProducts.sort(function(a, b) {
            return Number(a.price) - Number(b.price);
        });
    } else if (sort === "high") {
        filteredProducts.sort(function(a, b) {
            return Number(b.price) - Number(a.price);
        });
    } else if (sort === "az") {
        filteredProducts.sort(function(a, b) {
            return String(a.name || "").localeCompare(String(b.name || ""));
        });
    } else {
        filteredProducts.sort(function(a, b) {
            return Number(b.createdAt || 0) - Number(a.createdAt || 0);
        });
    }

    if (getElement("resultCount")) {
        getElement("resultCount").innerText =
            filteredProducts.length +
            " product" +
            (filteredProducts.length === 1 ? "" : "s");
    }

    if (filteredProducts.length === 0) {
        productTable.innerHTML = "";
        emptyState.style.display = "block";
        return;
    }

    emptyState.style.display = "none";

    productTable.innerHTML = filteredProducts.map(function(product) {
        const image = safeImageUrl(product.image);

        let thumb;

        if (image) {
            thumb =
                '<img class="product-thumb" src="' +
                image +
                '" alt="" onerror="this.style.display=\'none\'">';
        } else {
            thumb =
                '<div class="product-thumb product-thumb-placeholder">' +
                '<i class="fa-regular fa-image"></i>' +
                "</div>";
        }

        const statusClass = product.status === "Active" ? "active" : "inactive";

        return `
            <tr>
                <td>
                    <div class="product-cell">
                        ${thumb}
                        <span class="product-name">${product.name || ""}</span>
                    </div>
                </td>
                <td>
                    <span class="category-tag">${product.category || ""}</span>
                </td>
                <td>
                    <strong>${formatPrice(product.price)}</strong>
                </td>
                <td>${Number(product.quantity)}</td>
                <td>
                    <span class="status ${statusClass}">
                        ${product.status || ""}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="icon-btn" title="View details" data-action="view" data-id="${product.id}">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="icon-btn" title="Edit product" data-action="edit" data-id="${product.id}">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="icon-btn delete" title="Delete product" data-action="delete" data-id="${product.id}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

if (getElement("productTable")) {
    getElement("productTable").addEventListener("click", function(event) {
        const button = event.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const id = button.dataset.id;

        if (action === "view") {
            viewProduct(id);
        }

        if (action === "edit") {
            openEditForm(id);
        }

        if (action === "delete") {
            deleteProduct(id);
        }
    });
}

function viewProduct(id) {
    const product = products.find(function(item) {
        return String(item.id) === String(id);
    });

    if (!product) {
        showToast("Product not found.");
        return;
    }

    closeModal();

    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.id = "productModal";

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    const title = document.createElement("div");
    title.className = "modal-top";

    const heading = document.createElement("h2");
    heading.innerText = "Product Details";

    const close = document.createElement("button");
    close.className = "modal-close";
    close.type = "button";
    close.innerHTML = "&times;";
    close.addEventListener("click", closeModal);

    title.append(heading, close);
    modal.appendChild(title);

    const image = safeImageUrl(product.image);

    if (image) {
        const img = document.createElement("img");
        img.className = "modal-image";
        img.src = image;
        img.alt = product.name || "Product image";

        img.onerror = function() {
            img.remove();
        };

        modal.appendChild(img);
    }

    const name = document.createElement("h3");
    name.innerText = product.name || "";
    modal.appendChild(name);

    const details = document.createElement("div");
    details.className = "modal-details";

    const detailItems = [
        ["Category", product.category || ""],
        ["Price", formatPrice(product.price)],
        ["Quantity", String(product.quantity)],
        ["Status", product.status || ""]
    ];

    detailItems.forEach(function(itemData) {
        const item = document.createElement("div");

        const small = document.createElement("small");
        small.innerText = itemData[0];

        const strong = document.createElement("strong");
        strong.innerText = itemData[1];

        item.append(small, strong);
        details.appendChild(item);
    });

    modal.appendChild(details);

    const description = document.createElement("p");
    description.className = "modal-description";
    description.innerText = product.description || "No description provided.";

    modal.appendChild(description);

    const actions = document.createElement("div");
    actions.className = "modal-actions";

    const closeButton = document.createElement("button");
    closeButton.className = "secondary-btn";
    closeButton.innerText = "Close";
    closeButton.addEventListener("click", closeModal);

    const editButton = document.createElement("button");
    editButton.className = "primary-btn";
    editButton.innerHTML = '<i class="fa-solid fa-pen"></i> Edit Product';

    editButton.addEventListener("click", function() {
        closeModal();
        openEditForm(id);
    });

    actions.append(closeButton, editButton);
    modal.appendChild(actions);

    backdrop.appendChild(modal);

    backdrop.addEventListener("click", function(event) {
        if (event.target === backdrop) {
            closeModal();
        }
    });

    document.body.appendChild(backdrop);
    close.focus();
}

function closeModal() {
    const modal = getElement("productModal");

    if (modal) {
        modal.remove();
    }
}

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeModal();
    }
});

if (getElement("addForm")) {
    getElement("addForm").addEventListener("submit", function(event) {
        event.preventDefault();

        const name = getElement("addName").value.trim();
        const price = Number(getElement("addPrice").value);
        const quantity = Number(getElement("addQuantity").value);
        const category = getElement("addCategory").value.trim();
        const imageInput = getElement("addImage").value.trim();
        const image = safeImageUrl(imageInput);
        const status = getElement("addStatus").value;
        const description = getElement("addDescription").value.trim();

        if (
            name === "" ||
            category === "" ||
            !Number.isFinite(price) ||
            price <= 0 ||
            !Number.isInteger(quantity) ||
            quantity < 0
        ) {
            showToast("Please enter valid product details.");
            return;
        }

        if (imageInput !== "" && image === "") {
            showToast("Please enter a valid image URL.");
            return;
        }

        const product = {
            id: makeId(),
            name: name,
            price: price,
            quantity: quantity,
            category: category,
            image: image,
            status: status,
            description: description,
            createdAt: Date.now()
        };

        products.push(product);
        saveProducts();

        getElement("addForm").reset();

        updateImagePreview();
        updateStats();
        renderProducts();
        renderEditList();

        showToast("Product added successfully!");
        showPage("view");
    });
}

function updateImagePreview() {
    const input = getElement("addImage");
    const image = getElement("addImagePreview");
    const placeholder = getElement("addImagePlaceholder");

    if (!input || !image || !placeholder) {
        return;
    }

    const url = safeImageUrl(input.value.trim());

    if (!url) {
        image.hidden = true;
        image.removeAttribute("src");
        placeholder.hidden = false;
        return;
    }

    image.onload = function() {
        image.hidden = false;
        placeholder.hidden = true;
    };

    image.onerror = function() {
        image.hidden = true;
        placeholder.hidden = false;
    };

    image.src = url;
}

if (getElement("addImage")) {
    getElement("addImage").addEventListener("input", updateImagePreview);
}

function renderEditList() {
    const searchInput = getElement("editSearch");
    const list = getElement("editProductList");

    if (!searchInput || !list) {
        return;
    }

    const search = searchInput.value.trim().toLowerCase();

    const filteredProducts = products.filter(function(product) {
        const name = String(product.name || "").toLowerCase();
        const category = String(product.category || "").toLowerCase();

        return name.includes(search) || category.includes(search);
    });

    if (filteredProducts.length === 0) {
        list.innerHTML = `
            <div class="empty-state" style="display:block">
                <i class="fa-solid fa-box-open"></i>
                <h3>No products available</h3>
                <p>Add a product or try another search.</p>
            </div>
        `;

        return;
    }

    list.innerHTML = filteredProducts.map(function(product) {
        const image = safeImageUrl(product.image);

        let thumb;

        if (image) {
            thumb =
                '<img class="product-thumb" src="' +
                image +
                '" alt="" onerror="this.style.display=\'none\'">';
        } else {
            thumb =
                '<div class="product-thumb product-thumb-placeholder">' +
                '<i class="fa-regular fa-image"></i>' +
                "</div>";
        }

        return `
            <div class="edit-item">
                <div class="edit-item-info">
                    ${thumb}
                    <div>
                        <strong>${product.name || ""}</strong>
                        <p>
                            ${product.category || ""}
                            ·
                            ${formatPrice(product.price)}
                        </p>
                    </div>
                </div>
                <button class="primary-btn" data-edit-id="${product.id}">
                    <i class="fa-solid fa-pen"></i>
                    Edit
                </button>
            </div>
        `;
    }).join("");
}

if (getElement("editProductList")) {
    getElement("editProductList").addEventListener("click", function(event) {
        const button = event.target.closest("button[data-edit-id]");

        if (button) {
            openEditForm(button.dataset.editId);
        }
    });
}

function openEditForm(id) {
    const product = products.find(function(item) {
        return String(item.id) === String(id);
    });

    if (!product) {
        showToast("Product not found.");
        return;
    }

    showPage("edit");

    if (getElement("editId")) {
        getElement("editId").value = product.id;
    }

    if (getElement("editName")) {
        getElement("editName").value = product.name || "";
    }

    if (getElement("editPrice")) {
        getElement("editPrice").value = product.price || "";
    }

    if (getElement("editQuantity")) {
        getElement("editQuantity").value = product.quantity || "";
    }

    if (getElement("editCategory")) {
        getElement("editCategory").value = product.category || "";
    }

    if (getElement("editStatus")) {
        getElement("editStatus").value = product.status || "";
    }

    if (getElement("editImage")) {
        getElement("editImage").value = product.image || "";
    }

    if (getElement("editDescription")) {
        getElement("editDescription").value = product.description || "";
    }

    if (getElement("editSelectorCard")) {
        getElement("editSelectorCard").hidden = true;
    }

    if (getElement("editFormCard")) {
        getElement("editFormCard").hidden = false;
    }

    if (getElement("editName")) {
        getElement("editName").focus();
    }
}

if (getElement("editForm")) {
    getElement("editForm").addEventListener("submit", function(event) {
        event.preventDefault();

        const id = getElement("editId").value;

        const index = products.findIndex(function(item) {
            return String(item.id) === String(id);
        });

        if (index === -1) {
            showToast("Product not found.");
            cancelEdit();
            return;
        }

        const name = getElement("editName").value.trim();
        const price = Number(getElement("editPrice").value);
        const quantity = Number(getElement("editQuantity").value);
        const category = getElement("editCategory").value.trim();
        const imageInput = getElement("editImage").value.trim();
        const image = safeImageUrl(imageInput);
        const status = getElement("editStatus").value;
        const description = getElement("editDescription").value.trim();

        if (
            name === "" ||
            category === "" ||
            !Number.isFinite(price) ||
            price <= 0 ||
            !Number.isInteger(quantity) ||
            quantity < 0
        ) {
            showToast("Please enter valid product details.");
            return;
        }

        if (imageInput !== "" && image === "") {
            showToast("Please enter a valid image URL.");
            return;
        }

        products[index] = {
            ...products[index],
            name: name,
            price: price,
            quantity: quantity,
            category: category,
            image: image,
            status: status,
            description: description
        };

        saveProducts();
        updateStats();
        renderProducts();
        renderEditList();

        showToast("Product updated successfully!");
        showPage("view");
    });
}

function cancelEdit() {
    const editForm = getElement("editForm");

    if (!editForm) {
        return;
    }

    editForm.reset();

    if (getElement("editId")) {
        getElement("editId").value = "";
    }

    if (getElement("editFormCard")) {
        getElement("editFormCard").hidden = true;
    }

    if (getElement("editSelectorCard")) {
        getElement("editSelectorCard").hidden = false;
    }

    if (getElement("editSearch")) {
        getElement("editSearch").value = "";
    }

    renderEditList();
}

function deleteProduct(id) {
    const product = products.find(function(item) {
        return String(item.id) === String(id);
    });

    if (!product) {
        showToast("Product not found.");
        return;
    }

    const confirmed = confirm(
        'Are you sure you want to delete "' +
        product.name +
        '"?'
    );

    if (!confirmed) {
        return;
    }

    products = products.filter(function(item) {
        return String(item.id) !== String(id);
    });

    saveProducts();

    if (
        getElement("editId") &&
        String(getElement("editId").value) === String(id)
    ) {
        cancelEdit();
    }

    updateStats();
    renderProducts();
    renderEditList();

    showToast("Product deleted successfully!");
}

if (getElement("productSearch")) {
    getElement("productSearch").addEventListener("input", renderProducts);
}

if (getElement("categoryFilter")) {
    getElement("categoryFilter").addEventListener("change", renderProducts);
}

if (getElement("sortFilter")) {
    getElement("sortFilter").addEventListener("change", renderProducts);
}

if (getElement("editSearch")) {
    getElement("editSearch").addEventListener("input", renderEditList);
}

if (getElement("currentYear")) {
    getElement("currentYear").innerText = new Date().getFullYear();
}

updateStats();
renderProducts();
renderEditList();