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
        window.location.href = 'home.html'; // Adjust if your path is different
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

    if (countdownTimerInterval !== null) {
        clearInterval(countdownTimerInterval);
    }
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

    if (liveClockElement) {
        updateLiveClock();
        setInterval(updateLiveClock, 1000);
    }
    if (backButton) {
        backButton.addEventListener('click', goBackOrHome);
    }

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
            if (smallQrImage.src) {
                enlargedQrImage.src = smallQrImage.src;
                qrModal.style.display = 'flex';
            }
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
            button.classList.add('open');
            contentElement.classList.add('open-content');
            requestAnimationFrame(() => {
                contentElement.style.maxHeight = contentElement.scrollHeight + "px";
            });
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

        if (startsOpen) openContent();
        else closeContent();

        button.addEventListener('click', function(e) {
            if (button.tagName.toLowerCase() === 'a' && button.getAttribute('href') === '#') {
                e.preventDefault();
            }
            const isCurrentlyOpen = button.getAttribute('aria-expanded') === 'true';
            if (isCurrentlyOpen) closeContent();
            else openContent();
        });
    }
    setupCollapsible('validationHeaderButton', 'validationContentArea', 'validationChevron', true);
    setupCollapsible('leggiTuttoLink', 'dettagliContent', 'leggiTuttoChevron', false);

    // --- Pull-to-Refresh Logic ---
    if (ptrScrollView && ptrIndicator && ptrCardElement && ptrGearImg) {
        let ptrIsTouching = false;
        let ptrStartY = 0;
        let ptrPullDistance = 0;
        let ptrIsRefreshing = false;
        const PTR_THRESHOLD_VAL = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ptr-threshold')) || 70;
        const PTR_MAX_PULL_VISUAL_VAL = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ptr-max-pull')) || 200;
        const PTR_PULL_ACTIVATION_THRESHOLD = 5; // Minimum pixels to pull down to activate PTR visual state

        ptrScrollView.addEventListener('touchstart', (e) => {
            if (ptrIsRefreshing || e.touches.length > 1) return;
            // Only set up for PTR if scroll is at the very top
            if (ptrScrollView.scrollTop === 0) {
                ptrIsTouching = true;
                ptrStartY = e.touches[0].clientY;
                ptrPullDistance = 0; // Reset pull distance at the start of a new touch
                ptrCardElement.style.transition = 'none'; // Allow direct manipulation
                ptrGearImg.style.transition = 'transform 0.1s linear'; // For live rotation
                ptrIndicator.style.transition = 'opacity 0.2s ease, transform 0.2s ease'; // For smooth appearance
            } else {
                ptrIsTouching = false; // Not at top, not a PTR candidate
            }
        }, { passive: true });

        ptrScrollView.addEventListener('touchmove', (e) => {
            if (!ptrIsTouching || ptrIsRefreshing || e.touches.length > 1) {
                return;
            }

            // If user scrolled away from top after touchstart, PTR is no longer active for this touch
            // This check is crucial.
            if (ptrScrollView.scrollTop !== 0) {
                if (ptrPullDistance > 0) { // If we were in a pull, reset visuals smoothly
                    ptrCardElement.style.transition = 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    ptrCardElement.style.transform = 'translateY(0px)';
                    ptrIndicator.classList.remove('ptr-visible');
                    ptrGearImg.style.transform = 'rotate(0deg)';
                }
                ptrIsTouching = false; // Mark as no longer eligible for PTR this touch sequence
                ptrPullDistance = 0;
                return;
            }

            // At this point, ptrIsTouching is true AND ptrScrollView.scrollTop === 0.
            const currentY = e.touches[0].clientY;
            const diffY = currentY - ptrStartY; // Positive diffY means pulling down

            if (diffY > 0) { // User is pulling finger downwards
                // Only engage PTR visuals and prevent default if the pull is significant enough
                // OR if a pull was already in progress (ptrPullDistance > 0 implies diffY was > threshold previously)
                if (diffY > PTR_PULL_ACTIVATION_THRESHOLD || ptrPullDistance > 0) {
                    e.preventDefault(); // We are handling this as a PTR gesture

                    ptrPullDistance = diffY; // This is the current total pull from ptrStartY
                    const visualPull = Math.min(ptrPullDistance, PTR_MAX_PULL_VISUAL_VAL);

                    ptrCardElement.style.transform = `translateY(${visualPull * 0.6}px)`;
                    ptrIndicator.classList.add('ptr-visible');
                    const scale = Math.min(0.8 + (ptrPullDistance / PTR_THRESHOLD_VAL) * 0.2, 1);
                    const rotation = ptrPullDistance * 2;
                    ptrIndicator.style.transform = `translateY(${visualPull * 0.2}px) scale(${scale})`;
                    ptrGearImg.style.transform = `rotate(${rotation}deg)`;
                }
                // If diffY is small (<= PTR_PULL_ACTIVATION_THRESHOLD) and not already pulling (ptrPullDistance is 0),
                // do nothing here. This allows small downward jitters at the top without engaging PTR or preventing scroll.
            } else if (diffY < 0) { // User is moving finger upwards (reducing the pull or trying to scroll up)
                if (ptrPullDistance > 0) { // Only if a pull was actively in progress
                    // Reduce the pull distance. diffY is negative.
                    ptrPullDistance = Math.max(0, ptrPullDistance + diffY);
                    const visualPull = Math.min(ptrPullDistance, PTR_MAX_PULL_VISUAL_VAL);

                    ptrCardElement.style.transform = `translateY(${visualPull * 0.6}px)`;
                    const scale = Math.min(0.8 + (ptrPullDistance / PTR_THRESHOLD_VAL) * 0.2, 1);
                    const rotation = ptrPullDistance * 2; // Update rotation as pull reduces
                    ptrIndicator.style.transform = `translateY(${visualPull * 0.2}px) scale(${scale})`;
                    ptrGearImg.style.transform = `rotate(${rotation}deg)`;

                    if (ptrPullDistance === 0) {
                        ptrIndicator.classList.remove('ptr-visible');
                        // ptrIsTouching remains true here, as user is still at scrollTop 0 and touching.
                        // They might want to initiate a new pull down.
                    }
                }
                // If ptrPullDistance was already 0 and user moves finger up, it's an attempt to scroll content up.
                // Since scrollTop is 0, this won't do anything visually for scroll.
                // e.preventDefault() would not have been called for this scenario (because diffY wasn't > threshold),
                // so it's fine, native scroll (if possible for the element) isn't blocked.
            }
            // If diffY is 0, no change in pull distance, visuals remain as they are.
        }, { passive: false });

        ptrScrollView.addEventListener('touchend', () => {
            if (!ptrIsTouching || ptrIsRefreshing) { // If not a PTR touch or already refreshing
                // If card is displaced but not due to an active PTR touch that will refresh, reset it.
                // This handles cases where touchmove might have been interrupted.
                if (!ptrIsRefreshing && ptrCardElement.style.transform !== '' && ptrCardElement.style.transform !== 'translateY(0px)') {
                    ptrCardElement.style.transition = 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    ptrCardElement.style.transform = 'translateY(0px)';
                    ptrIndicator.classList.remove('ptr-visible');
                    ptrGearImg.style.transform = 'rotate(0deg)';
                }
                ptrIsTouching = false; // Reset for next touch interaction
                return;
            }
            ptrIsTouching = false; // Mark current touch sequence as ended for PTR

            ptrCardElement.style.transition = 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            ptrGearImg.style.transition = 'transform 0.3s ease-in-out'; // For gear rotation reset

            if (ptrPullDistance > PTR_THRESHOLD_VAL) {
                ptrIsRefreshing = true; // Briefly true during this synchronous operation
                console.log("Pull-to-Refresh triggered...");
                if (localStorage.getItem(ACTIVATION_STORAGE_KEY)) {
                    console.log("Active timer found. Timer state and related UI will NOT be changed by Pull-to-Refresh.");
                } else {
                    console.log("No active timer. Pull-to-Refresh has no timer state to affect.");
                }
                // --- Immediately reset UI visual elements (they will animate due to transitions) ---
                ptrCardElement.style.transform = 'translateY(0px)';
                ptrIndicator.classList.remove('ptr-visible');
                ptrGearImg.style.transform = 'rotate(0deg)'; // Reset gear rotation

                ptrIsRefreshing = false; // Reset flag
                console.log("Pull-to-Refresh visual snap-back initiated.");
            } else {
                // Pulled, but not enough to trigger refresh: just animate back
                ptrCardElement.style.transform = 'translateY(0px)';
                ptrIndicator.classList.remove('ptr-visible');
                ptrGearImg.style.transform = 'rotate(0deg)';
            }
            ptrPullDistance = 0; // Reset pull distance for the next interaction
        });
    }
});