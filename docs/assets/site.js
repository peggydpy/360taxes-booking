/* Fills the page from config.js — no need to edit this file. */
(function () {
  "use strict";
  var P = window.PREPARER || {};
  var digits = function (p) { return String(p || "").replace(/[^\d+]/g, ""); };
  var tel = P.phone ? "tel:" + digits(P.phone) : "";
  var sms = P.phone ? "sms:" + digits(P.phone) : "";
  var book = /^https:\/\//i.test(P.bookingUrl || "") ? P.bookingUrl : "";
  var all = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  document.title = (P.name ? P.name + " · " : "") + (P.title || "Tax Preparer") + " · " + (P.company || "360 Taxes") + (P.city ? " · " + P.city : "");

  all("[data-text]").forEach(function (el) { el.textContent = P[el.getAttribute("data-text")] || ""; });

  all("[data-src]").forEach(function (img) {
    var src = P[img.getAttribute("data-src")];
    if (src) img.src = src; else img.hidden = true;
  });
  var photo = document.querySelector(".photo");
  if (photo) photo.alt = P.name ? P.name + ", " + (P.title || "Tax Preparer") : "";

  // Initials badge when there's no photo
  var ini = document.querySelector("[data-initials]");
  if (ini) {
    if (P.photo) ini.hidden = true;
    else {
      ini.textContent = String(P.name || "").split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
      var g = document.querySelector(".hero-grid");
      if (g) g.classList.add("no-photo");
    }
  }

  all("[data-tel]").forEach(function (a) { if (tel) a.href = tel; else a.hidden = true; });
  all("[data-sms]").forEach(function (a) { if (sms) a.href = sms; else a.hidden = true; });

  // Book buttons: booking link if set, otherwise jump to the call/text band
  all("[data-book]").forEach(function (a) {
    if (book) { a.href = book; a.target = "_blank"; a.rel = "noopener"; }
    else if (a.closest(".callband")) { a.href = sms || tel || "#"; }
    else { a.href = "#book"; }
  });

  if (P.email) {
    var line = document.querySelector("[data-email-line]");
    if (line) line.hidden = false;
    all("[data-mailto]").forEach(function (a) { a.href = "mailto:" + P.email; });
  }

  // Flyer section
  if (P.flyer) {
    var sec = document.querySelector("[data-flyer-section]");
    if (sec) sec.hidden = false;
    all("[data-flyer-link],[data-flyer-download]").forEach(function (a) { a.href = P.flyer; });
  }
  var share = document.querySelector("[data-share]");
  if (share) share.addEventListener("click", function () {
    var data = { title: document.title, text: "Book your tax appointment with " + (P.name || "360 Taxes"), url: location.href };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    try {
      navigator.clipboard.writeText(location.href);
      share.textContent = "Link copied!";
      setTimeout(function () { share.textContent = "Share this page"; }, 2000);
    } catch (e) { window.prompt("Copy this link:", location.href); }
  });

  // Social links
  var social = document.querySelector("[data-social]");
  if (social) {
    [["facebook", "Facebook"], ["instagram", "Instagram"]].forEach(function (s) {
      if (/^https:\/\//i.test(P[s[0]] || "")) {
        var a = document.createElement("a");
        a.href = P[s[0]]; a.textContent = s[1]; a.target = "_blank"; a.rel = "noopener";
        social.appendChild(a);
      }
    });
  }
})();
