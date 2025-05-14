// --- Constants ---
const TICKET_DURATION_MINUTES = 75;
const ACTIVATION_STORAGE_KEY = 'ticket75ActivationTimestamp';
const ROME_TIME_ZONE = 'Europe/Rome';
const ROME_LOCALE = 'it-IT';
const ROME_DATE_OPTIONS = { timeZone: ROME_TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric' };
const ROME_TIME_OPTIONS = { timeZone: ROME_TIME_ZONE, hour: '2-digit', minute: '2-digit' };
const ROME_DATE_TIME_OPTIONS = { timeZone: ROME_TIME_ZONE, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };

let countdownTimerInterval = null;

// --- Global DOM Element References (cached) ---
let activateTicketLogo, statusBanner, emessoIlValueElement, tempoRestanteElement, attivatoIlElement, liveClockElement;
let qrModal, enlargeQrButton, smallQrImage, enlargedQrImage, closeQrBtn;
let ptrScrollView, ptrIndicator, ptrGearImg, ptrCardElement;
let backButton;

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
    if (liveClockElement) liveClockElement.textContent = time;
}

function goBackOrHome() {
    if (history.length > 1 && document.referrer) {
        history.back();
    } else {
        window.location.href = 'home.html';
    }
}

function startTicketCountdown(trueActivationTimestamp) {
    if (!tempoRestanteElement || !attivatoIlElement || !emessoIlValueElement || !statusBanner) {
        console.error("Timer display elements not found! Ensure they are cached in DOMContentLoaded.");
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
    if (countdownTimerInterval !== null) clearInterval(countdownTimerInterval);
    countdownTimerInterval = null;
    updateDisplay();
    countdownTimerInterval = setInterval(updateDisplay, 1000);
    statusBanner.classList.add('active');
}

document.addEventListener('DOMContentLoaded', function() {
    activateTicketLogo = document.getElementById('activateTicketLogo');
    statusBanner = document.getElementById('ticketStatusBanner');
    emessoIlValueElement = document.getElementById('emessoIlValue');
    tempoRestanteElement = document.getElementById('tempoRestante');
    attivatoIlElement = document.getElementById('attivatoIl');
    liveClockElement = document.getElementById('liveClock');
    backButton = document.getElementById('backButton');
    qrModal = document.getElementById('qrModal');
    enlargeQrButton = document.getElementById('enlargeQrButton');
    smallQrImage = document.getElementById('smallQrImage');
    enlargedQrImage = document.getElementById('enlargedQrImage');
    closeQrBtn = document.getElementById('closeQrBtn');
    ptrScrollView = document.getElementById('mainScrollView');
    ptrIndicator = document.getElementById('ptrIndicator');
    ptrGearImg = document.getElementById('ptrGearImg');
    ptrCardElement = document.getElementById('mainCard');

    if (liveClockElement) { updateLiveClock(); setInterval(updateLiveClock, 1000); }
    if (backButton) { backButton.addEventListener('click', goBackOrHome); }

    if (tempoRestanteElement && attivatoIlElement && statusBanner && emessoIlValueElement) {
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
                emessoIlValueElement.textContent = `${displayEmissionDate.toLocaleDateString(ROME_LOCALE, ROME_DATE_OPTIONS)} - ${displayEmissionDate.toLocaleTimeString(ROME_LOCALE, ROME_TIME_OPTIONS)}`;
                tempoRestanteElement.textContent = "Tempo restante: Scaduto";
                statusBanner.classList.add('active');
            }
        } else {
            tempoRestanteElement.textContent = `Tempo restante: ${TICKET_DURATION_MINUTES}min 00s`;
            attivatoIlElement.textContent = "Attiva cliccando il logo ASF";
            emessoIlValueElement.textContent = "--";
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

    if (enlargeQrButton && qrModal && smallQrImage && enlargedQrImage && closeQrBtn) {
        enlargeQrButton.addEventListener('click', function() {
            if (smallQrImage.src) { enlargedQrImage.src = smallQrImage.src; qrModal.style.display = 'flex'; }
        });
        closeQrBtn.addEventListener('click', function() { qrModal.style.display = 'none'; });
        window.addEventListener('click', function(event) {
            if (event.target === qrModal) { qrModal.style.display = 'none'; }
        });
    }

    function setupCollapsible(buttonId, contentId, chevronId, startsOpen = false) {
        const button = document.getElementById(buttonId);
        const contentElement = document.getElementById(contentId);
        const chevronElement = document.getElementById(chevronId);
        if (!button || !contentElement) return;
        const openContent = () => {
            button.classList.add('open'); contentElement.classList.add('open-content');
            requestAnimationFrame(() => { contentElement.style.maxHeight = contentElement.scrollHeight + "px"; });
            if (chevronElement) chevronElement.classList.add('open-chevron');
            button.setAttribute('aria-expanded', 'true');
        };
        const closeContent = () => {
            button.classList.remove('open'); contentElement.classList.remove('open-content');
            contentElement.style.maxHeight = "0";
            if (chevronElement) chevronElement.classList.remove('open-chevron');
            button.setAttribute('aria-expanded', 'false');
        };
        if (startsOpen) openContent(); else closeContent();
        button.addEventListener('click', function(e) {
            if (button.tagName.toLowerCase() === 'a' && button.getAttribute('href') === '#') e.preventDefault();
            const isCurrentlyOpen = button.getAttribute('aria-expanded') === 'true';
            if (isCurrentlyOpen) closeContent(); else openContent();
        });
    }
    setupCollapsible('validationHeaderButton', 'validationContentArea', 'validationChevron', true);
    setupCollapsible('leggiTuttoLink', 'dettagliContent', 'leggiTuttoChevron', false);

    // --- Pull-to-Refresh Logic ---
    if (ptrScrollView && ptrIndicator && ptrCardElement && ptrGearImg) {
        let ptrEligible = false; // True if touchstart occurred at top
        let ptrIsActuallyPulling = false; // True if a pull gesture is active
        let ptrStartY = 0;
        let ptrCurrentPullDistance = 0; // Tracks the current visual pull
        let ptrIsRefreshing = false;

        const PTR_THRESHOLD_REFRESH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ptr-threshold')) || 70;
        const PTR_MAX_PULL_VISUAL = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ptr-max-pull')) || 200;
        const PTR_ACTIVATION_DRAG_THRESHOLD = 10; // Min drag Y to consider it a pull attempt

        function resetPtrVisuals(animated = false) {
            ptrCardElement.style.transition = animated ? 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none';
            ptrGearImg.style.transition = animated ? 'transform 0.3s ease-in-out' : 'none';
            
            ptrCardElement.style.transform = 'translateY(0px)';
            ptrIndicator.classList.remove('ptr-visible');
            ptrGearImg.style.transform = 'rotate(0deg)';
            ptrCurrentPullDistance = 0;
        }

        ptrScrollView.addEventListener('touchstart', (e) => {
            if (ptrIsRefreshing || e.touches.length > 1) return;

            if (ptrScrollView.scrollTop < 1) { // Check if at the top
                ptrEligible = true;
                ptrStartY = e.touches[0].clientY;
                ptrIsActuallyPulling = false; // Reset pulling state
                ptrCurrentPullDistance = 0;
                // Set transitions for immediate feedback if pulling starts
                ptrCardElement.style.transition = 'none';
                ptrGearImg.style.transition = 'transform 0.1s linear';
                ptrIndicator.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            } else {
                ptrEligible = false;
                ptrIsActuallyPulling = false;
            }
        }, { passive: true });

        ptrScrollView.addEventListener('touchmove', (e) => {
            if (!ptrEligible || ptrIsRefreshing || e.touches.length > 1) {
                return; // Not eligible or busy
            }

            // If user scrolled away from top after touchstart, PTR is no longer active for this touch
            if (ptrScrollView.scrollTop >= 1) {
                if (ptrIsActuallyPulling) {
                    resetPtrVisuals(true); // Animate back if was pulling
                }
                ptrEligible = false;
                ptrIsActuallyPulling = false;
                return;
            }

            // At this point, touch started at top (ptrEligible=true) AND scroll is still at top.
            const currentY = e.touches[0].clientY;
            const diffY = currentY - ptrStartY; // Positive = pulling down

            if (diffY > PTR_ACTIVATION_DRAG_THRESHOLD) { // User is intentionally pulling down
                if (!ptrIsActuallyPulling) {
                    ptrIsActuallyPulling = true; // Engage pull state
                    // console.log("PTR: Start pulling");
                }
                e.preventDefault(); // Prevent native scroll as we are handling pull

                ptrCurrentPullDistance = diffY;
                const visualPull = Math.min(ptrCurrentPullDistance, PTR_MAX_PULL_VISUAL);

                ptrCardElement.style.transform = `translateY(${visualPull * 0.6}px)`;
                ptrIndicator.classList.add('ptr-visible');
                const scale = Math.min(0.8 + (ptrCurrentPullDistance / PTR_THRESHOLD_REFRESH) * 0.2, 1);
                const rotation = ptrCurrentPullDistance * 2;
                ptrIndicator.style.transform = `translateY(${visualPull * 0.2}px) scale(${scale})`;
                ptrGearImg.style.transform = `rotate(${rotation}deg)`;

            } else if (diffY < 0) { // User is moving finger upwards
                if (ptrIsActuallyPulling) { // If was actively pulling, reduce/cancel the pull
                    e.preventDefault(); // Still prevent native scroll

                    ptrCurrentPullDistance = Math.max(0, ptrCurrentPullDistance + diffY); // diffY is negative
                    const visualPull = Math.min(ptrCurrentPullDistance, PTR_MAX_PULL_VISUAL);
                    
                    ptrCardElement.style.transform = `translateY(${visualPull * 0.6}px)`;
                    const scale = Math.min(0.8 + (ptrCurrentPullDistance / PTR_THRESHOLD_REFRESH) * 0.2, 1);
                    const rotation = ptrCurrentPullDistance * 2;
                    ptrIndicator.style.transform = `translateY(${visualPull * 0.2}px) scale(${scale})`;
                    ptrGearImg.style.transform = `rotate(${rotation}deg)`;

                    if (ptrCurrentPullDistance === 0) {
                        ptrIndicator.classList.remove('ptr-visible');
                        ptrIsActuallyPulling = false; // No longer actively pulling
                        // console.log("PTR: Pull fully undone during move");
                    }
                }
                // If not ptrIsActuallyPulling and diffY < 0:
                // This means user touched at top and immediately tried to scroll "past" the top upwards.
                // We don't preventDefault, allowing any native bounce/overscroll effect.
                // ptrEligible remains true. If they then pull down, it can still trigger.
            } else { // diffY is small (0 to PTR_ACTIVATION_DRAG_THRESHOLD)
                if (ptrIsActuallyPulling) {
                    e.preventDefault(); // Maintain pull state if already pulling
                }
                // If not pulling and diffY is small, do nothing. This allows small jitters.
            }
        }, { passive: false });

        ptrScrollView.addEventListener('touchend', () => {
            const wasEligible = ptrEligible;
            const wasActuallyPulling = ptrIsActuallyPulling;

            ptrEligible = false;
            ptrIsActuallyPulling = false;

            if (!wasEligible || ptrIsRefreshing) {
                if (!ptrIsRefreshing && ptrCardElement.style.transform !== 'translateY(0px)') {
                    resetPtrVisuals(true); // Snap back if displaced without eligibility
                }
                return;
            }

            if (wasActuallyPulling && ptrCurrentPullDistance > PTR_THRESHOLD_REFRESH) {
                ptrIsRefreshing = true;
                // console.log("PTR: Refresh triggered");
                // No visual change for ptrIndicator.classList.add('ptr-refreshing');
                // Card stays slightly pulled down during the "fake" refresh time
                ptrCardElement.style.transition = 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                // Hold the card slightly down to indicate refresh, then snap back
                // ptrCardElement.style.transform = `translateY(${PTR_INDICATOR_HEIGHT * 0.3}px)`; // Optional: hold indicator position

                if (localStorage.getItem(ACTIVATION_STORAGE_KEY)) {
                    // console.log("Active timer found. Timer state and related UI will NOT be changed by Pull-to-Refresh.");
                } else {
                    // console.log("No active timer. Pull-to-Refresh has no timer state to affect.");
                }
                
                // Simulate refresh duration then reset
                // For your case, we just snap back immediately as per earlier requirements.
                setTimeout(() => { // Using timeout just to ensure transitions apply for snap-back
                    resetPtrVisuals(true);
                    ptrIsRefreshing = false;
                    // console.log("PTR: Refresh UI reset complete.");
                }, 50); // Short delay, effectively immediate snap back after logic
            } else {
                // console.log("PTR: Pull ended, no refresh threshold.");
                resetPtrVisuals(true); // Animate back if not refreshing
            }
            // ptrCurrentPullDistance is reset within resetPtrVisuals or on next touchstart
        });
    }
});