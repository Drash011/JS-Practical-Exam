const AllProducts = "productPageProducts";
let products = loadProducts();
let toastTimer;

const $ = (id) => document.getElementById(id);

function loadProducts() {
    try {
        const saved = JSON.parse(localStorage.getItem(AllProducts) || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
}

function saveProducts() {
    localStorage.setItem(AllProducts, JSON.stringify(products));
}

function makeId() {
    return Math.floor(Math.random() * 90000) + 10000;
}

function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, function(char) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };

        return entities[char];
    });
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
        maximumFractionDigits: 2,
    });
}

function showToast(message) {
    const toast = $("toast");

    if (!toast) {
        return;
    }

    toast.textContent = message;
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

    const pageElement = $(`${page}Page`);

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
        edit: "Edit Product",
    };

    if ($("pageHeading")) {
        $("pageHeading").textContent = titles[page];
    }

    if (page === "view") {
        renderProducts();
        updateStats();
    }

    if (page === "edit") {
        cancelEdit();
        renderEditList();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth",
    });
}

document.querySelectorAll(".nav-link").forEach(function(link) {
    link.addEventListener("click", function(event) {
        event.preventDefault();
        showPage(link.dataset.page);
    });
});

function updateStats() {
    if ($("totalProducts")) {
        $("totalProducts").textContent = products.length;
    }

    const categories = new Set(
        products
        .map(function(product) {
            return String(product.category || "")
                .trim()
                .toLowerCase();
        })
        .filter(Boolean),
    );

    if ($("totalCategories")) {
        $("totalCategories").textContent = categories.size;
    }

    if ($("lowStock")) {
        $("lowStock").textContent = products.filter(function(product) {
            return Number(product.quantity) <= 5;
        }).length;
    }

    if ($("activeProducts")) {
        $("activeProducts").textContent = products.filter(function(product) {
            return product.status === "Active";
        }).length;
    }
}

function updateCategoryFilter() {
    const select = $("categoryFilter");

    if (!select) {
        return;
    }

    const previous = select.value;

    const categories = [
        ...new Set(
            products
            .map(function(product) {
                return String(product.category || "").trim();
            })
            .filter(Boolean),
        ),
    ].sort(function(a, b) {
        return a.localeCompare(b);
    });

    select.innerHTML = '<option value="">All Categories</option>';

    categories.forEach(function(category) {
        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        select.appendChild(option);
    });

    if (categories.includes(previous)) {
        select.value = previous;
    }
}

function renderProducts() {
    if (!$("productSearch") || !$("categoryFilter") || !$("sortFilter")) {
        return;
    }

    updateCategoryFilter();

    const search = $("productSearch").value.trim().toLowerCase();
    const category = $("categoryFilter").value;
    const sort = $("sortFilter").value;

    let filtered = products.filter(function(product) {
        const productName = String(product.name || "").toLowerCase();
        const productCategory = String(product.category || "");

        const matchesName = productName.includes(search);
        const matchesCategory = !category || productCategory === category;

        return matchesName && matchesCategory;
    });

    if (sort === "low") {
        filtered.sort(function(a, b) {
            return Number(a.price) - Number(b.price);
        });
    } else if (sort === "high") {
        filtered.sort(function(a, b) {
            return Number(b.price) - Number(a.price);
        });
    } else if (sort === "az") {
        filtered.sort(function(a, b) {
            return String(a.name || "").localeCompare(String(b.name || ""));
        });
    } else {
        filtered.sort(function(a, b) {
            return Number(b.createdAt) - Number(a.createdAt);
        });
    }

    if ($("resultCount")) {
        $("resultCount").textContent =
            `${filtered.length} product${filtered.length === 1 ? "" : "s"}`;
    }

    const table = $("productTable");
    const empty = $("emptyState");

    if (!table || !empty) {
        return;
    }

    if (filtered.length === 0) {
        table.innerHTML = "";
        empty.style.display = "block";
        return;
    }

    empty.style.display = "none";

    table.innerHTML = filtered
        .map(function(product) {
            const image = safeImageUrl(product.image);

            const thumb = image ?
                `<img class="product-thumb" src="${escapeHTML(image)}" alt="" onerror="this.style.display='none'">` :
                `<div class="product-thumb product-thumb-placeholder">
                <i class="fa-regular fa-image"></i>
            </div>`;

            const statusClass = product.status === "Active" ? "active" : "inactive";

            return `
            <tr>
                <td>
                    <div class="product-cell">
                        ${thumb}
                        <span class="product-name">
                            ${escapeHTML(product.name)}
                        </span>
                    </div>
                </td>

                <td>
                    <span class="category-tag">
                        ${escapeHTML(product.category)}
                    </span>
                </td>

                <td>
                    <strong>${formatPrice(product.price)}</strong>
                </td>

                <td>${Number(product.quantity)}</td>

                <td>
                    <span class="status ${statusClass}">
                        ${escapeHTML(product.status)}
                    </span>
                </td>

                <td>
                    <div class="action-buttons">
                        <button
                            class="icon-btn"
                            title="View details"
                            data-action="view"
                            data-id="${escapeHTML(product.id)}"
                        >
                            <i class="fa-solid fa-eye"></i>
                        </button>

                        <button
                            class="icon-btn"
                            title="Edit product"
                            data-action="edit"
                            data-id="${escapeHTML(product.id)}"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button
                            class="icon-btn delete"
                            title="Delete product"
                            data-action="delete"
                            data-id="${escapeHTML(product.id)}"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        })
        .join("");
}

if ($("productTable")) {
    $("productTable").addEventListener("click", function(event) {
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
        return item.id === id;
    });

    if (!product) {
        return;
    }

    closeModal();

    const image = safeImageUrl(product.image);

    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.id = "productModal";

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Product details");

    const title = document.createElement("div");
    title.className = "modal-top";

    const heading = document.createElement("h2");
    heading.textContent = "Product Details";

    const close = document.createElement("button");
    close.className = "modal-close";
    close.type = "button";
    close.innerHTML = "&times;";
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", closeModal);

    title.append(heading, close);
    modal.appendChild(title);

    if (image) {
        const img = document.createElement("img");

        img.className = "modal-image";
        img.src = image;
        img.alt = product.name;

        img.onerror = function() {
            img.remove();
        };

        modal.appendChild(img);
    }

    const name = document.createElement("h3");
    name.textContent = product.name;
    modal.appendChild(name);

    const details = document.createElement("div");
    details.className = "modal-details";

    const detailItems = [
        ["Category", product.category],
        ["Price", formatPrice(product.price)],
        ["Quantity", String(product.quantity)],
        ["Status", product.status],
    ];

    detailItems.forEach(function(itemData) {
        const label = itemData[0];
        const value = itemData[1];

        const item = document.createElement("div");

        const small = document.createElement("small");
        small.textContent = label;

        const strong = document.createElement("strong");
        strong.textContent = value;

        item.append(small, strong);
        details.appendChild(item);
    });

    modal.appendChild(details);

    const description = document.createElement("p");
    description.className = "modal-description";
    description.textContent = product.description || "No description provided.";

    modal.appendChild(description);

    const actions = document.createElement("div");
    actions.className = "modal-actions";

    const editButton = document.createElement("button");
    editButton.className = "primary-btn";
    editButton.innerHTML = '<i class="fa-solid fa-pen"></i> Edit Product';

    editButton.addEventListener("click", function() {
        closeModal();
        openEditForm(id);
    });

    const closeButton = document.createElement("button");
    closeButton.className = "secondary-btn";
    closeButton.textContent = "Close";

    closeButton.addEventListener("click", closeModal);

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
    const modal = $("productModal");

    if (modal) {
        modal.remove();
    }
}

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeModal();
    }
});

if ($("addForm")) {
    $("addForm").addEventListener("submit", function(event) {
        event.preventDefault();

        const name = $("addName").value.trim();
        const price = Number($("addPrice").value);
        const quantity = Number($("addQuantity").value);
        const category = $("addCategory").value.trim();
        const imageInput = $("addImage").value.trim();
        const image = safeImageUrl(imageInput);
        const status = $("addStatus").value;
        const description = $("addDescription").value.trim();

        if (!name ||
            !category ||
            !Number.isFinite(price) ||
            price <= 0 ||
            !Number.isInteger(quantity) ||
            quantity < 0
        ) {
            showToast("Please enter valid product details.");
            return;
        }

        if (imageInput && !image) {
            showToast("Please enter a valid HTTP or HTTPS image URL.");
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
            createdAt: Date.now(),
        };

        products.push(product);
        saveProducts();

        $("addForm").reset();

        updateImagePreview();
        updateStats();
        renderProducts();

        showToast("Product added successfully!");
        showPage("view");
    });
}

function updateImagePreview() {
    if (!$("addImage") || !$("addImagePreview") || !$("addImagePlaceholder")) {
        return;
    }

    const url = safeImageUrl($("addImage").value.trim());
    const img = $("addImagePreview");
    const placeholder = $("addImagePlaceholder");

    if (!url) {
        img.hidden = true;
        img.removeAttribute("src");
        placeholder.hidden = false;
        return;
    }

    img.onload = function() {
        img.hidden = false;
        placeholder.hidden = true;
    };

    img.onerror = function() {
        img.hidden = true;
        placeholder.hidden = false;
    };

    img.src = url;
}

if ($("addImage")) {
    $("addImage").addEventListener("input", updateImagePreview);
}

function renderEditList() {
    if (!$("editSearch") || !$("editProductList")) {
        return;
    }

    const search = $("editSearch").value.trim().toLowerCase();

    const filtered = products.filter(function(product) {
        const name = String(product.name || "").toLowerCase();
        const category = String(product.category || "").toLowerCase();

        return name.includes(search) || category.includes(search);
    });

    const list = $("editProductList");

    if (!filtered.length) {
        list.innerHTML = `
            <div class="empty-state" style="display:block">
                <i class="fa-solid fa-box-open"></i>
                <h3>No products available</h3>
                <p>Add a product or try another search.</p>
            </div>
        `;

        return;
    }

    list.innerHTML = filtered
        .map(function(product) {
            const image = safeImageUrl(product.image);

            const thumb = image ?
                `<img class="product-thumb" src="${escapeHTML(image)}" alt="" onerror="this.style.display='none'">` :
                `<div class="product-thumb product-thumb-placeholder">
                <i class="fa-regular fa-image"></i>
            </div>`;

            return `
            <div class="edit-item">
                <div class="edit-item-info">
                    ${thumb}

                    <div>
                        <strong>${escapeHTML(product.name)}</strong>
                        <p>
                            ${escapeHTML(product.category)}
                            ·
                            ${formatPrice(product.price)}
                        </p>
                    </div>
                </div>

                <button
                    class="primary-btn"
                    data-edit-id="${escapeHTML(product.id)}"
                >
                    <i class="fa-solid fa-pen"></i>
                    Edit
                </button>
            </div>
        `;
        })
        .join("");
}

if ($("editProductList")) {
    $("editProductList").addEventListener("click", function(event) {
        const button = event.target.closest("button[data-edit-id]");

        if (button) {
            openEditForm(button.dataset.editId);
        }
    });
}

function openEditForm(id) {
    const product = products.find(function(item) {
        return item.id === id;
    });

    if (!product) {
        showToast("Product not found.");
        return;
    }

    showPage("edit");

    $("editId").value = product.id;
    $("editName").value = product.name;
    $("editPrice").value = product.price;
    $("editQuantity").value = product.quantity;
    $("editCategory").value = product.category;
    $("editStatus").value = product.status;
    $("editImage").value = product.image || "";
    $("editDescription").value = product.description || "";

    $("editSelectorCard").hidden = true;
    $("editFormCard").hidden = false;

    $("editName").focus();
}

if ($("editForm")) {
    $("editForm").addEventListener("submit", function(event) {
        event.preventDefault();

        const id = $("editId").value;

        const index = products.findIndex(function(item) {
            return item.id === id;
        });

        if (index === -1) {
            showToast("Product not found.");
            cancelEdit();
            return;
        }

        const name = $("editName").value.trim();
        const price = Number($("editPrice").value);
        const quantity = Number($("editQuantity").value);
        const category = $("editCategory").value.trim();
        const imageInput = $("editImage").value.trim();
        const image = safeImageUrl(imageInput);

        if (!name ||
            !category ||
            !Number.isFinite(price) ||
            price <= 0 ||
            !Number.isInteger(quantity) ||
            quantity < 0
        ) {
            showToast("Please enter valid product details.");
            return;
        }

        if (imageInput && !image) {
            showToast("Please enter a valid HTTP or HTTPS image URL.");
            return;
        }

        products[index] = {
            ...products[index],
            name: name,
            price: price,
            quantity: quantity,
            category: category,
            image: image,
            status: $("editStatus").value,
            description: $("editDescription").value.trim(),
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
    if (!$("editForm")) {
        return;
    }

    $("editForm").reset();
    $("editId").value = "";

    $("editFormCard").hidden = true;
    $("editSelectorCard").hidden = false;

    $("editSearch").value = "";

    renderEditList();
}

function deleteProduct(id) {
    const product = products.find(function(item) {
        return item.id === id;
    });

    if (!product) {
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete "${product.name}"?`,
    );

    if (!confirmed) {
        return;
    }

    products = products.filter(function(item) {
        return item.id !== id;
    });

    saveProducts();

    if ($("editId") && $("editId").value === id) {
        cancelEdit();
    }

    updateStats();
    renderProducts();
    renderEditList();

    showToast("Product deleted successfully!");
}

if ($("currentYear")) {
    $("currentYear").textContent = new Date().getFullYear();
}


updateStats();
renderProducts();
renderEditList();