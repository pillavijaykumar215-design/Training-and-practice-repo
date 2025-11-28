document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (preserve placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsList = details.participants.length > 0
          ? details.participants
              .map(p => {
                // handle participant represented as string or object { email }
                const email = (typeof p === "string") ? p : (p.email || JSON.stringify(p));
                return `<li class="participant-item"><span class="participant-email">${email}</span><button class="delete-participant" data-email="${email}" data-activity="${name}" aria-label="Unregister ${email}">✖</button></li>`;
              })
              .join("")
          : "<li class=\"participant-item\"><em>No participants yet</em></li>";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants (${details.participants.length}/${details.max_participants}):</strong>
            <ul class="participants-list">
              ${participantsList}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Delegate click handler for unregister/delete buttons
  activitiesList.addEventListener('click', async (evt) => {
    const btn = evt.target.closest('.delete-participant');
    if (!btn) return;

    const email = btn.dataset.email;
    const activity = btn.dataset.activity;

    if (!email || !activity) return;

    try {
      const resp = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
      const result = await resp.json();

      if (resp.ok) {
        // Refresh activities to update counts and list
        await fetchActivities();
        messageDiv.textContent = result.message || `${email} unregistered from ${activity}`;
        messageDiv.className = 'message success';
        messageDiv.classList.remove('hidden');
        setTimeout(() => messageDiv.classList.add('hidden'), 4000);
      } else {
        messageDiv.textContent = result.detail || 'Failed to unregister participant';
        messageDiv.className = 'message error';
        messageDiv.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Error unregistering participant:', err);
      messageDiv.textContent = 'Error unregistering participant';
      messageDiv.className = 'message error';
      messageDiv.classList.remove('hidden');
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        // set classes explicitly to include base "message" class
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities so the participants list updates immediately
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
