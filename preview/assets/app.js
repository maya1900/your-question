(function () {
  var toastTimer;

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function showToast(message) {
    var toast = qs("[data-toast]");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("visible");
    }, 2200);
  }

  function setupMobileNav() {
    var toggle = qs("[data-mobile-menu]");
    var drawer = qs("[data-mobile-drawer]");
    if (!toggle || !drawer) return;
    toggle.addEventListener("click", function () {
      var open = drawer.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  function setupSegmented() {
    qsa("[data-segmented]").forEach(function (group) {
      qsa("button", group).forEach(function (button) {
        button.addEventListener("click", function () {
          qsa("button", group).forEach(function (item) {
            item.setAttribute("aria-pressed", String(item === button));
          });
          group.dispatchEvent(new CustomEvent("segmentchange", {
            bubbles: true,
            detail: { value: button.dataset.value || button.textContent.trim() }
          }));
        });
      });
    });
  }

  function setupTabs() {
    qsa("[data-tabs]").forEach(function (root) {
      var buttons = qsa("[data-tab-target]", root);
      var panels = qsa("[data-tab-panel]", root);
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          var target = button.dataset.tabTarget;
          buttons.forEach(function (item) {
            item.setAttribute("aria-pressed", String(item === button));
          });
          panels.forEach(function (panel) {
            panel.hidden = panel.dataset.tabPanel !== target;
          });
        });
      });
    });
  }

  function setupVotes() {
    qsa("[data-vote]").forEach(function (button) {
      button.addEventListener("click", function () {
        var countEl = qs("[data-vote-count]", button);
        var count = Number(button.dataset.count || (countEl ? countEl.textContent : "0"));
        var active = button.getAttribute("aria-pressed") === "true";
        count += active ? -1 : 1;
        button.dataset.count = String(count);
        button.setAttribute("aria-pressed", String(!active));
        if (countEl) countEl.textContent = String(count);
        showToast(active ? "已取消点赞" : "点赞成功，作者积分 +2");
      });
    });
  }

  function setupAcceptAnswer() {
    qsa("[data-accept]").forEach(function (button) {
      button.addEventListener("click", function () {
        var card = button.closest(".answer-card");
        qsa("[data-accept]").forEach(function (item) {
          item.setAttribute("aria-pressed", "false");
          item.textContent = "采纳";
        });
        qsa(".answer-card.accepted").forEach(function (item) {
          item.classList.remove("accepted");
          var pill = qs("[data-accepted-pill]", item);
          if (pill) pill.remove();
        });
        button.setAttribute("aria-pressed", "true");
        button.textContent = "已采纳";
        if (card) {
          card.classList.add("accepted");
          var meta = qs(".answer-meta", card);
          if (meta && !qs("[data-accepted-pill]", card)) {
            var pill = document.createElement("span");
            pill.className = "status-pill solved";
            pill.dataset.acceptedPill = "true";
            pill.textContent = "最佳答案";
            meta.prepend(pill);
          }
        }
        showToast("已采纳最佳答案，回答者积分 +25");
      });
    });
  }

  function setupHomeFilters() {
    var root = qs("[data-question-browser]");
    if (!root) return;
    var search = qs("[data-question-search]", root);
    var tagButtons = qsa("[data-filter-tag]", root);
    var empty = qs("[data-empty-state]", root);
    var currentSort = "hot";
    var currentTag = "all";

    function scoreFor(card) {
      if (currentSort === "latest") return Number(card.dataset.latest || 0);
      if (currentSort === "unsolved") return card.dataset.solved === "false" ? 1 : 0;
      return Number(card.dataset.hot || 0);
    }

    function applyFilters() {
      var query = (search && search.value || "").trim().toLowerCase();
      var cards = qsa("[data-question-card]", root);
      var visible = 0;
      cards.forEach(function (card) {
        var tagHit = currentTag === "all" || (card.dataset.tags || "").split(",").indexOf(currentTag) >= 0;
        var text = (card.textContent || "").toLowerCase();
        var queryHit = !query || text.indexOf(query) >= 0;
        var unsolvedHit = currentSort !== "unsolved" || card.dataset.solved === "false";
        var show = tagHit && queryHit && unsolvedHit;
        card.classList.toggle("hidden", !show);
        if (show) visible += 1;
      });
      cards.sort(function (a, b) {
        return scoreFor(b) - scoreFor(a);
      }).forEach(function (card) {
        card.parentNode.appendChild(card);
      });
      if (empty) empty.classList.toggle("visible", visible === 0);
    }

    qsa("[data-sort]", root).forEach(function (button) {
      button.addEventListener("click", function () {
        currentSort = button.dataset.sort;
        applyFilters();
      });
    });

    tagButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        currentTag = button.dataset.filterTag;
        tagButtons.forEach(function (item) {
          item.classList.toggle("selected", item === button);
          item.setAttribute("aria-pressed", String(item === button));
        });
        applyFilters();
      });
    });

    if (search) search.addEventListener("input", applyFilters);
    applyFilters();
  }

  function setupTagSearch() {
    var input = qs("[data-tag-search]");
    var empty = qs("[data-tag-empty]");
    if (!input) return;
    function apply() {
      var q = input.value.trim().toLowerCase();
      var visible = 0;
      qsa("[data-tag-card]").forEach(function (card) {
        var show = !q || card.textContent.toLowerCase().indexOf(q) >= 0;
        card.classList.toggle("hidden", !show);
        if (show) visible += 1;
      });
      if (empty) empty.classList.toggle("visible", visible === 0);
    }
    input.addEventListener("input", apply);
    apply();
  }

  function setupAskForm() {
    var form = qs("[data-ask-form]");
    if (!form) return;
    var title = qs("[name='title']", form);
    var body = qs("[name='body']", form);
    var tags = qs("[name='tags']", form);
    var preview = qs("[data-ask-preview]");
    var points = qs("[data-points-preview]");
    var kind = form.dataset.formKind || "question";
    var basePoints = Number(form.dataset.pointsBase || (kind === "answer" ? 15 : 10));

    function setInvalid(field, invalid) {
      var row = field && field.closest(".form-row");
      if (row) row.classList.toggle("invalid", invalid);
    }

    function updatePreview() {
      if (preview) {
        preview.textContent = title.value.trim() || "问题标题会显示在这里";
      }
      if (points) {
        var tagCount = tags.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean).length;
        var extra = kind === "question" ? Math.min(tagCount, 4) * 2 : 0;
        points.textContent = String(basePoints + extra);
      }
    }

    [title, body, tags].forEach(function (field) {
      if (!field) return;
      field.addEventListener("input", updatePreview);
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var titleBad = title.value.trim().length < 12;
      var bodyBad = body.value.trim().length < 40;
      var tagsBad = tags.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean).length < 1;
      setInvalid(title, titleBad);
      setInvalid(body, bodyBad);
      setInvalid(tags, tagsBad);
      if (titleBad || bodyBad || tagsBad) {
        showToast(kind === "answer" ? "回答还没写清楚，先补全再提交" : "还有字段没写清楚，先补全再提交");
        return;
      }
      showToast(kind === "answer" ? "回答已提交，积分 +" + (points ? points.textContent : String(basePoints)) : "问题已发布，提问积分 +" + (points ? points.textContent : String(basePoints)));
      form.reset();
      updatePreview();
    });

    updatePreview();
  }

  function setupAuthForm() {
    qsa("[data-auth-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var email = qs("input[type='email']", form);
        var password = qs("input[type='password']", form);
        var emailBad = !email.value.includes("@");
        var passwordBad = password.value.length < 6;
        [email, password].forEach(function (field) {
          field.closest(".form-row").classList.remove("invalid");
        });
        if (emailBad) email.closest(".form-row").classList.add("invalid");
        if (passwordBad) password.closest(".form-row").classList.add("invalid");
        if (emailBad || passwordBad) {
          showToast("请检查邮箱和密码格式");
          return;
        }
        showToast(form.dataset.authForm === "register" ? "账号已创建，欢迎加入社区" : "登录成功，回到首页继续答题");
      });
    });
  }

  function setupTagPickers() {
    qsa(".tag-chip").forEach(function (button) {
      button.addEventListener("click", function () {
        var pressed = button.getAttribute("aria-pressed") === "true";
        button.setAttribute("aria-pressed", String(!pressed));
      });
    });
  }

  function setupAuthTabs() {
    var root = qs("[data-auth-tabs]");
    if (!root) return;
    var tabs = qsa("[data-auth-tab]", root);
    var panels = qsa("[data-auth-panel]", root);
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.dataset.authTab;
        tabs.forEach(function (item) {
          item.setAttribute("aria-pressed", String(item === tab));
        });
        panels.forEach(function (panel) {
          panel.hidden = panel.dataset.authPanel !== target;
        });
      });
    });
  }

  function setupProgressBars() {
    qsa("[data-progress]").forEach(function (el) {
      var value = Number(el.dataset.progress || 0);
      el.style.width = Math.max(6, Math.min(100, value)) + "%";
    });
  }

  function setupProfileFilters() {
    var root = qs("[data-profile-feed]");
    if (!root) return;
    var buttons = qsa("[data-profile-filter]", root);
    var items = qsa("[data-activity-item]", root);
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var filter = button.dataset.profileFilter;
        buttons.forEach(function (item) {
          item.setAttribute("aria-pressed", String(item === button));
        });
        items.forEach(function (item) {
          item.hidden = filter !== "all" && item.dataset.kind !== filter;
        });
      });
    });
  }

  function setupAskPreviewActions() {
    qsa("[data-copy-preview]").forEach(function (button) {
      button.addEventListener("click", function () {
        var target = qs(button.dataset.copyPreview);
        if (!target) return;
        var text = target.value || target.textContent || "";
        text = text.trim();
        if (!text) {
          showToast("还没有可复制的内容");
          return;
        }
        if (!navigator.clipboard) {
          showToast("浏览器不支持自动复制，手动复制一下");
          return;
        }
        navigator.clipboard.writeText(text).then(function () {
          showToast("已复制问题标题");
        }).catch(function () {
          showToast("复制失败，手动复制一下");
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMobileNav();
    setupSegmented();
    setupTabs();
    setupVotes();
    setupAcceptAnswer();
    setupHomeFilters();
    setupTagSearch();
    setupAskForm();
    setupAuthForm();
    setupTagPickers();
    setupAuthTabs();
    setupProgressBars();
    setupProfileFilters();
    setupAskPreviewActions();
  });
}());
