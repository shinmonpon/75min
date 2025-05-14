// --- Constants ---
const TICKET_DURATION_MINUTES = 75;
const ACTIVATION_STORAGE_KEY = 'ticket75ActivationTimestamp';
const ROME_TIME_ZONE = 'Europe/Rome';
const ROME_LOCALE = 'it-IT';
const ROME_DATE_OPTIONS = { timeZone: ROME_TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric' };
const ROME_TIME_OPTIONS = { timeZone: ROME_TIME_ZONE, hour: '2-digit', minute: '2-digit' };
const ROME_DATE_TIME_OPTIONS = { timeZone: ROME_TIME_ZONE, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };

let countdownTimerInterval = null;

// --- Utility Functions ---
function formatTimeForTimer(milliseconds) {
    if (milliseconds <= 0) return "Scaduto";

    let totalSeconds = Math.floor(milliseconds / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes < 10 ? '0' + minutes : minutes}min`;
    } else {
        return `${minutes}min ${seconds < 10 ? '0' + seconds : seconds}s`;
    }
}

function updateLiveClock() {
    const now = new Date();
    const time = now.toLocaleTimeString(ROME_LOCALE, ROME_DATE_TIME_OPTIONS);
    const clockElement = document.getElementById('liveClock');
    if (clockElement) clockElement.textContent = time;
}

function startTicketCountdown(trueActivationTimestamp) {
    const tempoRestanteElement = document.getElementById('tempoRestante');
    const attivatoIlElement = document.getElementById('attivatoIl');
    const emessoIlValueElement = document.getElementById('emessoIlValue');
    const statusBanner = document.getElementById('ticketStatusBanner');

    if (!tempoRestanteElement || !attivatoIlElement || !emessoIlValueElement || !statusBanner) {
        console.error("Timer display elements not found for 75min ticket!");
        return;
    }

    const displayEmissionTimestamp = trueActivationTimestamp - (10 * 60 * 1000);
    const displayEmissionDate = new Date(displayEmissionTimestamp);
    const activationDate = new Date(trueActivationTimestamp);

    const formattedActivationDate = activationDate.toLocaleDateString(ROME_LOCALE, ROME_DATE_OPTIONS);
    const formattedActivationTime = activationDate.toLocaleTimeString(ROME_LOCALE, ROME_TIME_OPTIONS);

    const formattedDisplayEmissionDate = displayEmissionDate.toLocaleDateString(ROME_LOCALE, ROME_DATE_OPTIONS);
    const formattedDisplayEmissionTime = displayEmissionDate.toLocaleTimeString(ROME_LOCALE, ROME_TIME_OPTIONS);

    attivatoIlElement.textContent = `Attivato il: ${formattedActivationDate} - ${formattedActivationTime}`;
    emessoIlValueElement.textContent = `${formattedDisplayEmissionDate} - ${formattedDisplayEmissionTime}`;

    const endTime = trueActivationTimestamp + (TICKET_DURATION_MINUTES * 60 * 1000);

    function updateDisplay() {
        const now = Date.now();
        const remaining = endTime - now;

        if (remaining <= 0) {
            tempoRestanteElement.textContent = "Tempo restante: Scaduto";
            if (countdownTimerInterval) clearInterval(countdownTimerInterval);
            countdownTimerInterval = null;
        } else {
            tempoRestanteElement.textContent = "Tempo restante: " + formatTimeForTimer(remaining);
        }
    }

    if (countdownTimerInterval !== null) {
        clearInterval(countdownTimerInterval);
    }
    countdownTimerInterval = null;
    updateDisplay();
    countdownTimerInterval = setInterval(updateDisplay, 1000);
    statusBanner.classList.add('active');
}


document.addEventListener('DOMContentLoaded', function() {
    updateLiveClock();
    setInterval(updateLiveClock, 1000);

    const activateTicketLogo = document.getElementById('activateTicketLogo');
    const statusBanner = document.getElementById('ticketStatusBanner');
    const emessoIlValueElement = document.getElementById('emessoIlValue');
    const tempoRestanteElement = document.getElementById('tempoRestante');
    const attivatoIlElement = document.getElementById('attivatoIl');

    // Load initial timer state
    if (tempoRestanteElement && attivatoIlElement && statusBanner) { // Ensure elements exist
        const storedActivationTimestamp = localStorage.getItem(ACTIVATION_STORAGE_KEY);
        if (storedActivationTimestamp) {
            const trueActivationTimestamp = parseInt(storedActivationTimestamp, 10);
            const endTime = trueActivationTimestamp + (TICKET_DURATION_MINUTES * 60 * 1000);
            if (Date.now() < endTime) {
                startTicketCountdown(trueActivationTimestamp);
            } else {
                const activationDate = new Date(trueActivationTimestamp);
                const displayEmissionTimestamp = trueActivationTimestamp - (10 * 60 * 1000);
                const displayEmissionDate = new Date(displayEmissionTimestamp);

                attivatoIlElement.textContent = `Attivato il: ${activationDate.toLocaleDateString(ROME_LOCALE, ROME_DATE_OPTIONS)} - ${activationDate.toLocaleTimeString(ROME_LOCALE, ROME_TIME_OPTIONS)}`;
                if(emessoIlValueElement) emessoIlValueElement.textContent = `${displayEmissionDate.toLocaleDateString(ROME_LOCALE, ROME_DATE_OPTIONS)} - ${displayEmissionDate.toLocaleTimeString(ROME_LOCALE, ROME_TIME_OPTIONS)}`;
                tempoRestanteElement.textContent = "Tempo restante: Scaduto";
                statusBanner.classList.add('active');
            }
        } else {
            tempoRestanteElement.textContent = `Tempo restante: ${TICKET_DURATION_MINUTES}min 00s`;
            attivatoIlElement.textContent = "Attiva cliccando il logo ASF";
            if(emessoIlValueElement) emessoIlValueElement.textContent = "--";
        }
    }


    if (activateTicketLogo) {
        activateTicketLogo.addEventListener('click', function() {
            const existingTimestamp = localStorage.getItem(ACTIVATION_STORAGE_KEY);
            let allowActivation = true;
            if (existingTimestamp) {
                allowActivation = confirm("Un biglietto è già attivo o scaduto. Vuoi attivarne uno nuovo? Il timer e l'orario di emissione verranno resettati.");
            }
            if (allowActivation) {
                const trueActivationTimestamp = Date.now();
                localStorage.setItem(ACTIVATION_STORAGE_KEY, trueActivationTimestamp.toString());
                startTicketCountdown(trueActivationTimestamp);
                console.log("Timer activated/reset by logo. Timestamp:", trueActivationTimestamp);
            }
        });
    }

    // QR Modal
    const qrModal = document.getElementById('qrModal');
    const enlargeQrButton = document.getElementById('enlargeQrButton');
    const smallQrImage = document.getElementById('smallQrImage');
    const enlargedQrImage = document.getElementById('enlargedQrImage');
    const closeQrBtn = document.getElementById('closeQrBtn');

    if (enlargeQrButton && qrModal && smallQrImage && enlargedQrImage && closeQrBtn) {
        enlargeQrButton.addEventListener('click', function() {
            enlargedQrImage.src = smallQrImage.src;
            qrModal.style.display = 'flex';
        });
        closeQrBtn.addEventListener('click', function() { qrModal.style.display = 'none'; });
        window.addEventListener('click', function(event) {
            if (event.target === qrModal) { qrModal.style.display = 'none'; }
        });
    }

    // Collapsible sections
    function setupCollapsible(buttonId, contentId, chevronId, startsOpen = false) {
        const button = document.getElementById(buttonId);
        const contentElement = document.getElementById(contentId);
        const chevronElement = document.getElementById(chevronId);
        if (!button || !contentElement) { return; }

        const openContent = () => {
            button.classList.add('open');
            contentElement.classList.add('open-content');
            contentElement.style.maxHeight = contentElement.scrollHeight + "px";
            if (chevronElement) chevronElement.classList.add('open-chevron');
            button.setAttribute('aria-expanded', 'true');
        };
        const closeContent = () => {
            button.classList.remove('open');
            contentElement.classList.remove('open-content');
            contentElement.style.maxHeight = "0";
            if (chevronElement) chevronElement.classList.remove('open-chevron');
            button.setAttribute('aria-expanded', 'false');
        };

        if (startsOpen) { openContent(); } else { closeContent(); }

        button.addEventListener('click', function(e) {
            if (button.tagName.toLowerCase() === 'a') { e.preventDefault(); }
            const isCurrentlyOpen = button.getAttribute('aria-expanded') === 'true';
            if (isCurrentlyOpen) { closeContent(); } else { openContent(); }
        });
    }
    setupCollapsible('validationHeaderButton', 'validationContentArea', 'validationChevron', true);
    setupCollapsible('leggiTuttoLink', 'dettagliContent', 'leggiTuttoChevron', false);


    // --- Pull-to-Refresh Logic ---
    const ptrScrollView = document.getElementById('mainScrollView');
    const ptrIndicator = document.getElementById('ptrIndicator');
    const ptrGearImg = document.getElementById('ptrGearImg');
    const ptrCardElement = document.getElementById('mainCard');

    let ptrIsTouching = false;
    let ptrStartY = 0;
    let ptrPullDistance = 0;
    let ptrIsRefreshing = false;
    const PTR_THRESHOLD = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ptr-threshold')) || 70;
    const PTR_MAX_PULL_VISUAL = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ptr-max-pull')) || 200;


    if (ptrScrollView && ptrIndicator && ptrCardElement && ptrGearImg) {
        ptrScrollView.addEventListener('touchstart', (e) => {
            if (ptrIsRefreshing || e.touches.length > 1) return;
            if (ptrScrollView.scrollTop === 0) {
                ptrIsTouching = true;
                ptrStartY = e.touches[0].clientY;
                ptrCardElement.style.transition = 'none';
                ptrGearImg.style.transition = 'transform 0.1s linear';
                ptrIndicator.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            }
        }, { passive: true });

        ptrScrollView.addEventListener('touchmove', (e) => {
            if (!ptrIsTouching || ptrIsRefreshing || e.touches.length > 1) return;

            let diffY = e.touches[0].clientY - ptrStartY;

            if (ptrScrollView.scrollTop === 0 && diffY > 0) {
                if (ptrIsTouching) e.preventDefault();
                ptrPullDistance = diffY;
                let visualPull = Math.min(ptrPullDistance, PTR_MAX_PULL_VISUAL);

                ptrCardElement.style.transform = `translateY(${visualPull * 0.6}px)`;
                ptrIndicator.classList.add('ptr-visible');

                let scale = Math.min(0.8 + (ptrPullDistance / PTR_THRESHOLD) * 0.2, 1);
                let rotation = ptrPullDistance * 2;
                ptrIndicator.style.transform = `translateY(${visualPull * 0.2}px) scale(${scale})`;
                ptrGearImg.style.transform = `rotate(${rotation}deg)`;

            } else if (diffY < 0 && ptrPullDistance > 0) {
                ptrPullDistance = Math.max(0, ptrPullDistance + diffY);
                let visualPull = Math.min(ptrPullDistance, PTR_MAX_PULL_VISUAL);
                ptrCardElement.style.transform = `translateY(${visualPull * 0.6}px)`;
                let scale = Math.min(0.8 + (ptrPullDistance / PTR_THRESHOLD) * 0.2, 1);
                ptrIndicator.style.transform = `translateY(${visualPull * 0.2}px) scale(${scale})`;
                if(ptrPullDistance === 0) {
                    ptrIndicator.classList.remove('ptr-visible');
                    ptrIsTouching = false;
                }
                ptrStartY = e.touches[0].clientY;
            } else {
                if (ptrIsTouching && ptrPullDistance > 0 && diffY <=0 ) {
                    ptrIsTouching = false;
                    ptrCardElement.style.transition = 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    ptrCardElement.style.transform = 'translateY(0px)';
                    ptrIndicator.classList.remove('ptr-visible');
                    ptrGearImg.style.transform = 'rotate(0deg)';
                    ptrPullDistance = 0;
                }
            }
        }, { passive: false });

        ptrScrollView.addEventListener('touchend', () => {
            if (!ptrIsTouching || ptrIsRefreshing) {
                if (!ptrIsRefreshing && ptrCardElement.style.transform !== '' && ptrCardElement.style.transform !== 'translateY(0px)') {
                    ptrCardElement.style.transition = 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    ptrCardElement.style.transform = 'translateY(0px)';
                    ptrIndicator.classList.remove('ptr-visible');
                    ptrGearImg.style.transform = 'rotate(0deg)';
                }
                ptrIsTouching = false;
                return;
            }
            ptrIsTouching = false;

            ptrCardElement.style.transition = 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            ptrGearImg.style.transition = 'transform 0.3s ease-in-out';

            if (ptrPullDistance > PTR_THRESHOLD) {
                ptrIsRefreshing = true; // Briefly true during this synchronous operation

                console.log("Pull-to-Refresh triggered...");
                // --- Actual refresh logic (MODIFIED) ---
                // The pull-to-refresh will now NOT reset the timer or its display
                // if a ticket is already active.
                if (localStorage.getItem(ACTIVATION_STORAGE_KEY)) {
                    console.log("Active timer found. Timer state and related UI will NOT be changed by Pull-to-Refresh.");
                    // You could add logic here if PTR should refresh other non-timer data.
                } else {
                    console.log("No active timer. Pull-to-Refresh has no timer state to affect.");
                }
                // --- End of actual refresh logic ---

                // --- Immediately reset UI visual elements (they will animate due to transitions) ---
                ptrCardElement.style.transform = 'translateY(0px)';
                ptrIndicator.classList.remove('ptr-visible');
                // ptrIndicator.classList.remove('ptr-refreshing'); // Already removed this class usage
                ptrGearImg.style.transform = 'rotate(0deg)'; // Reset gear rotation

                ptrIsRefreshing = false; // Reset flag
                console.log("Pull-to-Refresh visual snap-back initiated.");

            } else {
                // Pulled, but not enough to trigger refresh: just animate back
                ptrCardElement.style.transform = 'translateY(0px)';
                ptrIndicator.classList.remove('ptr-visible');
                ptrGearImg.style.transform = 'rotate(0deg)';
            }
            ptrPullDistance = 0;
        });
    }
});