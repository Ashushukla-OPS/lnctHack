/**
 * ProvenStack — Full API Test Suite (v3)
 * Uses correct routes confirmed from actual route files.
 * Run: node test_all.js
 */

const BASE = "http://localhost:3000";
let PASS = 0, FAIL = 0, SKIP = 0;

// Shared state between tests
let cookieJar = ""; // Both accessToken + refreshToken cookies
let userId = "", teamId = "", taskId = "";
let meetId = "", roomId = "";

// ─── helpers ────────────────────────────────────────────────────────────────

async function api(method, path, body, auth = true) {
  const headers = { "Content-Type": "application/json" };
  if (auth && cookieJar) headers["Cookie"] = cookieJar;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(`${BASE}${path}`, opts);
    // Merge ALL Set-Cookie values (capture both accessToken + refreshToken)
    const raw = r.headers.get("set-cookie");
    if (raw) {
      // Split on cookie boundaries, extract name=value only
      const cookies = raw.split(/,(?=\s*[\w-]+=)/)
        .map(c => c.split(";")[0].trim())
        .filter(Boolean);
      // Merge into existing jar (replace updated cookies, keep others)
      const jar = new Map();
      cookieJar.split("; ").forEach(c => {
        const [k] = c.split("=");
        if (k) jar.set(k, c);
      });
      cookies.forEach(c => {
        const [k] = c.split("=");
        if (k) jar.set(k, c);
      });
      cookieJar = [...jar.values()].join("; ");
    }
    let json = {};
    try { json = await r.json(); } catch(_) {}
    return { status: r.status, body: json };
  } catch (e) {
    return { status: 0, body: { message: `FETCH ERROR: ${e.message}` } };
  }
}

function check(label, status, body, expectedStatus, validateFn) {
  const statusOk = Array.isArray(expectedStatus)
    ? expectedStatus.includes(status)
    : status === expectedStatus;
  const dataOk = !validateFn || validateFn(body);
  if (statusOk && dataOk) {
    console.log(`  ✅  ${label}`);
    PASS++;
    return true;
  } else {
    console.log(`  ❌  ${label}  [got ${status}, expected ${Array.isArray(expectedStatus) ? expectedStatus.join("/") : expectedStatus}]`);
    if (body?.message) console.log(`       └─ ${body.message}`);
    FAIL++;
    return false;
  }
}

function skip(label) {
  console.log(`  ⚠️   SKIP  ${label}`);
  SKIP++;
}

function section(name) {
  console.log(`\n${"═".repeat(58)}`);
  console.log(`   ${name}`);
  console.log("═".repeat(58));
}

// ════════════════════════════════════════════════════════════
// 1. AUTH
// ════════════════════════════════════════════════════════════
async function testAuth() {
  section("AUTH — Register & Login");
  const ts   = Date.now();
  const email = `tester_${ts}@provenstack.dev`;
  const pwd   = "Test@12345";

  // Register
  let r = await api("POST", "/api/auth/register", { name: "Test User", email, password: pwd }, false);
  check("POST /register — new user", r.status, r.body, 201);
  if (cookieJar) console.log(`       └─ cookie set after register ✓`);

  // After register the cookie is set. Pull userId from body.
  userId = r.body?.data?._id || r.body?._id || "";

  // Login (also sets fresh cookie)
  cookieJar = ""; // reset, re-login fresh
  r = await api("POST", "/api/auth/login", { email, password: pwd }, false);
  const ok = check("POST /login — valid credentials", r.status, r.body, 200);
  if (ok) {
    userId = r.body?.data?._id || userId;
    console.log(`       └─ userId  : ${userId}`);
    console.log(`       └─ cookie  : ${cookieJar ? cookieJar.slice(0, 60) + "…" : "NOT SET ❗"}`);
  }

  // Refresh token
  r = await api("POST", "/api/auth/get-accesstoken");
  check("POST /get-accesstoken — refresh", r.status, r.body, 200);
}

// ════════════════════════════════════════════════════════════
// 2. USERS
// ════════════════════════════════════════════════════════════
async function testUsers() {
  section("USERS — Profile & Reputation");

  let r = await api("GET", "/api/users/me");
  const ok = check("GET /users/me — logged in user", r.status, r.body, 200);
  if (ok && !userId) userId = r.body?.data?._id;

  r = await api("GET", "/api/users/");
  check("GET /users/ — all users", r.status, r.body, 200);

  r = await api("PATCH", "/api/users/update-profile", { bio: "ProvenStack tester 🚀" });
  check("PATCH /users/update-profile", r.status, r.body, 200);

  if (userId) {
    r = await api("GET", `/api/users/${userId}/reputation`);
    check("GET /users/:id/reputation", r.status, r.body, 200, b => b.data?.reputationScore !== undefined);

    r = await api("GET", `/api/users/${userId}`);
    check("GET /users/:id — single user", r.status, r.body, 200);
  } else {
    skip("GET /users/:id/reputation (no userId)");
    skip("GET /users/:id (no userId)");
  }
}

// ════════════════════════════════════════════════════════════
// 3. TEAMS
// ════════════════════════════════════════════════════════════
async function testTeams() {
  section("TEAMS — Create, Browse & Slots");

  let r = await api("GET", "/api/teams");
  check("GET /teams — browse all teams", r.status, r.body, 200);

  r = await api("POST", "/api/teams/create", {
    teamName: `AutoTeam_${Date.now()}`,
    description: "Automated test team",
    maxMembers: 4,
  });
  // team controller returns { success, message, team } — not ApiResponse wrapper
  const created = check("POST /teams/create", r.status, r.body, 201, b => b.team?._id || b.data?._id);
  if (created) {
    teamId = r.body.team?._id || r.body.data?._id;
    console.log(`       └─ teamId: ${teamId}`);
  }

  if (!teamId) { skip("Team sub-tests (no teamId)"); return; }

  r = await api("GET", `/api/teams/${teamId}`);
  check("GET /teams/:id — single team", r.status, r.body, 200);

  // Slots
  r = await api("PATCH", `/api/teams/${teamId}/slots/add`, {
    role: "Backend Developer",
    minScore: 0,
    requiredSkills: ["Node.js", "MongoDB"],
  });
  const slotOk = check("PATCH /teams/:id/slots/add", r.status, r.body, 200, b => b.data?.openSlots?.length > 0);
  let slotId = slotOk ? r.body.data.openSlots[r.body.data.openSlots.length - 1]._id : null;

  if (slotId) {
    r = await api("PATCH", `/api/teams/${teamId}/slots/edit/${slotId}`, { role: "Full-Stack Developer" });
    check("PATCH /teams/:id/slots/edit/:slotId", r.status, r.body, 200);

    r = await api("PATCH", `/api/teams/${teamId}/slots/remove/${slotId}`);
    check("PATCH /teams/:id/slots/remove/:slotId", r.status, r.body, 200);
  } else {
    skip("Slot edit/remove (no slotId)");
    skip("Slot edit/remove (no slotId)");
  }
}

// ════════════════════════════════════════════════════════════
// 4. JOIN REQUESTS
// Actual routes: POST /send, GET /my-requests, GET /incoming, GET /:id
// ════════════════════════════════════════════════════════════
async function testJoinRequests() {
  section("JOIN REQUESTS — Send & Manage");

  if (!teamId) { skip("All join-request tests (no teamId)"); return; }

  // POST /send with teamId in body — can't join own team → 400/403
  let r = await api("POST", "/api/join-request/send", {
    teamId,
    message: "I'd love to join!",
  });
  check("POST /join-request/send (own team → 400/403)", r.status, r.body, [400, 403]);

  // GET /incoming — team leader sees pending requests
  r = await api("GET", "/api/join-request/incoming");
  check("GET /join-request/incoming — leader inbox", r.status, r.body, 200);

  // GET /my-requests — user's own sent requests
  r = await api("GET", "/api/join-request/my-requests");
  check("GET /join-request/my-requests — my sent requests", r.status, r.body, 200);
}

// ════════════════════════════════════════════════════════════
// 5. NOTIFICATIONS
// ════════════════════════════════════════════════════════════
async function testNotifications() {
  section("NOTIFICATIONS — Inbox");

  let r = await api("GET", "/api/notifications");
  check("GET /notifications — all", r.status, r.body, 200);

  r = await api("GET", "/api/notifications/unread-count");
  check("GET /notifications/unread-count", r.status, r.body, 200);

  r = await api("PATCH", "/api/notifications/read-all");
  check("PATCH /notifications/read-all — mark all read", r.status, r.body, 200);
}

// ════════════════════════════════════════════════════════════
// 6. MESSAGES
// ════════════════════════════════════════════════════════════
async function testMessages() {
  section("MESSAGES — Team Group Chat");

  if (!teamId) { skip("All message tests (no teamId)"); return; }

  let r = await api("POST", `/api/message/send/${teamId}`, {
    message: "Hello team! 🚀 Testing ProvenStack",
  });
  const sent = check("POST /message/send/:teamId", r.status, r.body, 201, b => b.data?._id);
  const msgId = sent ? r.body.data._id : null;

  r = await api("GET", `/api/message/${teamId}`);
  check("GET /message/:teamId — history", r.status, r.body, 200);

  r = await api("GET", `/api/message/unread/${teamId}`);
  check("GET /message/unread/:teamId — unread count", r.status, r.body, 200);

  if (msgId) {
    r = await api("POST", `/api/message/react/${msgId}`, { emoji: "🔥" });
    check("POST /message/react/:msgId — react", r.status, r.body, 200);

    r = await api("PATCH", `/api/message/edit/${msgId}`, { message: "Edited message ✏️" });
    check("PATCH /message/edit/:msgId", r.status, r.body, 200);

    r = await api("DELETE", `/api/message/${msgId}?mode=self`);
    check("DELETE /message/:msgId?mode=self", r.status, r.body, 200);
  } else {
    skip("React/Edit/Delete message (no msgId)");
  }
}

// ════════════════════════════════════════════════════════════
// 7. TASKS
// ════════════════════════════════════════════════════════════
async function testTasks() {
  section("TASKS — Task Board");

  if (!teamId) { skip("All task tests (no teamId)"); return; }

  let r = await api("POST", `/api/tasks/${teamId}`, {
    title: "Write unit tests",
    description: "Cover all controller functions",
    priority: "high",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const created = check("POST /tasks/:teamId — create task", r.status, r.body, 201, b => b.data?._id);
  if (created) taskId = r.body.data._id;

  r = await api("GET", `/api/tasks/${teamId}`);
  check("GET /tasks/:teamId — all tasks", r.status, r.body, 200);

  if (taskId) {
    // Task status enum: "todo" | "inprogress" | "done"  (no underscore!)
    r = await api("PATCH", `/api/tasks/${taskId}`, { status: "inprogress" });
    check("PATCH /tasks/:taskId — update status to inprogress", r.status, r.body, 200);

    r = await api("DELETE", `/api/tasks/${taskId}`);
    check("DELETE /tasks/:taskId", r.status, r.body, 200);
  } else {
    skip("Task update/delete (no taskId)");
  }
}

// ════════════════════════════════════════════════════════════
// 8. HACKATHON
// ════════════════════════════════════════════════════════════
async function testHackathon() {
  section("HACKATHON — Timer & Events");

  let r = await api("GET", "/api/hackathon");
  check("GET /hackathon — list all", r.status, r.body, 200);
}

// ════════════════════════════════════════════════════════════
// 9. VIDEO MEET
// ════════════════════════════════════════════════════════════
async function testMeet() {
  section("MEET — Video Conference");

  if (!teamId) { skip("All meet tests (no teamId)"); return; }

  let r = await api("POST", `/api/meet/schedule/${teamId}`, {
    title: "Sprint Planning Call",
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  });
  const created = check("POST /meet/schedule/:teamId — schedule", r.status, r.body, 201, b => b.data?._id);
  if (created) {
    meetId = r.body.data._id;
    roomId = r.body.data.roomId;
    console.log(`       └─ roomId: ${roomId}`);
  }

  r = await api("GET", `/api/meet/${teamId}`);
  check("GET /meet/:teamId — team meetings", r.status, r.body, 200);

  if (roomId) {
    r = await api("GET", `/api/meet/room/${roomId}`);
    check("GET /meet/room/:roomId — room details", r.status, r.body, 200);

    r = await api("PATCH", `/api/meet/start/${roomId}`);
    check("PATCH /meet/start/:roomId", r.status, r.body, 200);

    r = await api("PATCH", `/api/meet/end/${roomId}`);
    check("PATCH /meet/end/:roomId", r.status, r.body, 200);

    r = await api("DELETE", `/api/meet/${meetId}`);
    check("DELETE /meet/:meetId — cancel", r.status, r.body, [200, 400]); // 400 if already ended
  } else {
    skip("Meet room/start/end/delete (no roomId)");
  }
}

// ════════════════════════════════════════════════════════════
// 10. SCORE
// ════════════════════════════════════════════════════════════
async function testScore() {
  section("SCORE — Leaderboard");

  let r = await api("GET", "/api/score/leaderboard/all");
  check("GET /score/leaderboard/all", r.status, r.body, 200);
}

// ════════════════════════════════════════════════════════════
// 11. AI SUMMARY
// ════════════════════════════════════════════════════════════
async function testSummary() {
  section("AI SUMMARY — Gemini Chat Summary");

  if (!teamId) { skip("All summary tests (no teamId)"); return; }

  let r = await api("GET", `/api/summary/${teamId}/project`);
  // 200 with cached/generated summary, or 400 if no messages yet
  check("GET /summary/:teamId/project", r.status, r.body, [200, 400, 503]);

  r = await api("GET", `/api/summary/${teamId}/history`);
  check("GET /summary/:teamId/history", r.status, r.body, 200);

  r = await api("GET", `/api/summary/${teamId}/progress`);
  check("GET /summary/:teamId/progress", r.status, r.body, [200, 400, 403, 503]);

  r = await api("POST", `/api/summary/${teamId}/regenerate`);
  check("POST /summary/:teamId/regenerate", r.status, r.body, [200, 400, 429, 503]);
}

// ════════════════════════════════════════════════════════════
// 12. REQUEST CHAT (pre-approval DMs)
// ════════════════════════════════════════════════════════════
async function testRequestChat() {
  section("REQUEST CHAT — Pre-Approval DMs");

  // No real join request in this test session — just check auth works (not 401/500)
  // After error middleware fix, invalid ObjectId → 404
  const fakeId = "000000000000000000000000";
  let r = await api("GET", `/api/request-chat/${fakeId}`);
  // Expect 404 (not found) — confirms route registered, auth passed, error middleware works
  check("GET /request-chat/:requestId (auth OK, 404 for fake)", r.status, r.body, 404);
}

// ════════════════════════════════════════════════════════════
// RUN ALL
// ════════════════════════════════════════════════════════════
(async () => {
  console.log("\n🚀  ProvenStack — Full API Test Suite v2");
  console.log(`    Target: ${BASE}\n`);

  await testAuth();
  await testUsers();
  await testTeams();
  await testJoinRequests();
  await testNotifications();
  await testMessages();
  await testTasks();
  await testHackathon();
  await testMeet();
  await testScore();
  await testSummary();
  await testRequestChat();

  // ─── FINAL REPORT ──────────────────────────────────────────
  const total = PASS + FAIL + SKIP;
  const pct   = Math.round((PASS / (PASS + FAIL || 1)) * 100);

  console.log(`\n${"═".repeat(58)}`);
  console.log("   FINAL RESULTS");
  console.log("═".repeat(58));
  console.log(`   ✅  Passed  : ${PASS}`);
  console.log(`   ❌  Failed  : ${FAIL}`);
  console.log(`   ⚠️   Skipped : ${SKIP}`);
  console.log(`   📊  Total   : ${total}`);
  console.log(`   🎯  Score   : ${pct}%`);
  console.log("═".repeat(58));

  if (FAIL === 0) {
    console.log("\n   🎉  ALL TESTS PASSED — ProvenStack is healthy!\n");
  } else {
    console.log(`\n   ⚡  ${FAIL} test(s) failed. See details above.\n`);
  }
})();
