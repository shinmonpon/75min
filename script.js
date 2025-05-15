// --- Constants ---
const TICKET_DURATION_MINUTES = 65;
const ACTIVATION_STORAGE_KEY = 'ticket75ActivationTimestamp';
const ROME_TIME_ZONE = 'Europe/Rome';
const ROME_LOCALE = 'it-IT';
const ROME_DATE_OPTIONS = { timeZone: ROME_TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric' };
const ROME_TIME_OPTIONS = { timeZone: ROME_TIME_ZONE, hour: '2-digit', minute: '2-digit' };
const ROME_DATE_TIME_OPTIONS = { timeZone: ROME_TIME_ZONE, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };

const NUM_SPOKES = 8; 
const THRESHOLD_ROTATE_DURATION = 2500; 
const THRESHOLD_ROTATE_DEGREES = 180;   
const SPOKE_PULSE_INTERVAL = 150;     
const SPOKE_PULSE_TRAIL_LENGTH = 4; 
const SPOKE_PULSE_MAX_OPACITY = 1.0;
const SPOKE_PULSE_MIN_OPACITY = 0.2; 
const SPOKE_PULSE_OPACITY_STEP = SPOKE_PULSE_TRAIL_LENGTH > 1 
    ? (SPOKE_PULSE_MAX_OPACITY - SPOKE_PULSE_MIN_OPACITY) / (SPOKE_PULSE_TRAIL_LENGTH - 1) 
    : 0;
const DELAY_BEFORE_SPOKE_PULSE = 300; // Delay in ms after rotation starts, before pulse begins


let countdownTimerInterval = null;
let activateTicketLogo, statusBanner, emessoIlValueElement, tempoRestanteElement, attivatoIlElement, liveClockElement;
let qrModal, enlargeQrButton, smallQrImage, enlargedQrImage, closeQrBtn;
let ptrScrollView, ptrIndicator, ptrGearContainerEl, ptrGearSvgEl; 
let ptrSpokeElements = [];
let backButton;

let ptrAnimationPhase = 'idle'; 
let thresholdRotateStartTime = 0;
let thresholdRotateRafId = null; 
let spokePulseIntervalId = null;
let spokePulseStartTimeoutId = null; // For delaying the spoke pulse
let currentLeadingSpokeIndex = 0; 

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
    if (history.length > 1 && document.referrer && new URL(document.referrer).origin === window.location.origin) {
        history.back();
    } else {
        window.location.href = 'index.html'; 
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
    
    ptrGearContainerEl = document.getElementById('ptrGearContainer');
    ptrGearSvgEl = document.getElementById('ptrGearSvg'); 
    if (ptrGearContainerEl && ptrGearSvgEl) {
        for (let i = 0; i < NUM_SPOKES; i++) {
            const spoke = document.getElementById(`ptr-spoke-${i}`);
            if (spoke) ptrSpokeElements.push(spoke);
            else console.warn(`PTR Spoke 'ptr-spoke-${i}' not found.`);
        }
        if (ptrSpokeElements.length === 0 && NUM_SPOKES > 0) { 
            console.error("PTR: No SVG spoke elements found. Spoke animation disabled.");
        }
    } else {
        console.error("PTR: ptrGearContainer or ptrGearSvg not found. Ensure HTML is updated for SVG gear.");
    }

    if (liveClockElement) { updateLiveClock(); setInterval(updateLiveClock, 1000); }
    if (backButton) { backButton.addEventListener('click', goBackOrHome); }

    // --- Timer Logic ---
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

    // --- ASF Logo Click Activation ---
    if (activateTicketLogo) {
        activateTicketLogo.addEventListener('click', function() {
            const existingTimestamp = localStorage.getItem(ACTIVATION_STORAGE_KEY);
            let allowActivation = true;
            if (existingTimestamp) {
                const currentActivationTime = parseInt(existingTimestamp, 10);
                const ticketEndTime = currentActivationTime + (TICKET_DURATION_MINUTES * 60 * 1000);
                if (Date.now() < ticketEndTime) { 
                    allowActivation = confirm("Un biglietto è già attivo. Vuoi attivarne uno nuovo sovrascrivendo quello attuale? Il timer e l'orario di emissione verranno resettati.");
                } else { 
                     allowActivation = confirm("Un biglietto precedente è scaduto. Vuoi attivarne uno nuovo? Il timer e l'orario di emissione verranno resettati.");
                }
            }
            if (allowActivation) {
                const trueActivationTimestamp = Date.now();
                localStorage.setItem(ACTIVATION_STORAGE_KEY, trueActivationTimestamp.toString());
                startTicketCountdown(trueActivationTimestamp);
            }
        });
    }

    // --- QR Code Modal Logic ---
    if (enlargeQrButton && qrModal && smallQrImage && enlargedQrImage && closeQrBtn) {
        enlargeQrButton.addEventListener('click', function() {
            if (smallQrImage.src) { enlargedQrImage.src = smallQrImage.src; qrModal.style.display = 'flex'; }
        });
        closeQrBtn.addEventListener('click', function() { qrModal.style.display = 'none'; });
        qrModal.addEventListener('click', function(event) { 
            if (event.target === qrModal) { qrModal.style.display = 'none'; }
        });
    }

    // --- Collapsible Sections Logic ---
    function setupCollapsible(buttonId, contentId, chevronId, startsOpen = false) {
        const button = document.getElementById(buttonId);
        const contentElement = document.getElementById(contentId);
        const chevronElement = document.getElementById(chevronId);
        if (!button || !contentElement) {
            return;
        }
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
            contentElement.style.maxHeight = "0"; 
            contentElement.classList.remove('open-content'); 
            if (chevronElement) chevronElement.classList.remove('open-chevron');
            button.setAttribute('aria-expanded', 'false');
        };

        if (startsOpen) {
            openContent();
        } else {
            closeContent(); 
        }

        button.addEventListener('click', function(e) {
            if (button.tagName.toLowerCase() === 'button' || (button.getAttribute('role') === 'button')) {
                e.preventDefault();
            }
            const isCurrentlyOpen = button.getAttribute('aria-expanded') === 'true';
            if (isCurrentlyOpen) {
                closeContent();
            } else {
                openContent();
            }
        });
    }
    setupCollapsible('validationHeaderButton', 'validationContentArea', 'validationChevron', true);
    setupCollapsible('leggiTuttoLink', 'dettagliContent', 'leggiTuttoChevron', false);

    // --- Pull-to-Refresh Logic ---
    if (ptrScrollView && ptrIndicator && ptrGearContainerEl && (ptrSpokeElements.length === NUM_SPOKES || NUM_SPOKES === 0) ) {
        let ptrEligible = false;        
        let ptrIsActive = false;        
        let ptrStartY = 0;
        let ptrCurrentPullDistance = 0; 

        const PTR_TOP_THRESHOLD_REFRESH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ptr-threshold')) || 70;
        const PTR_TOP_MAX_PULL_VISUAL = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ptr-max-pull')) || 180;
        const PTR_TOP_ACTIVATION_DRAG_THRESHOLD = 10; 
        const PTR_INDICATOR_HEIGHT_VALUE = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ptr-indicator-height')) || 60;


        function clearAllPtrAnimations() {
            if (thresholdRotateRafId) cancelAnimationFrame(thresholdRotateRafId);
            if (spokePulseIntervalId) clearInterval(spokePulseIntervalId);
            if (spokePulseStartTimeoutId) clearTimeout(spokePulseStartTimeoutId);
            thresholdRotateRafId = null;
            spokePulseIntervalId = null;
            spokePulseStartTimeoutId = null;
            ptrGearContainerEl.classList.remove('ptr-gear-spinning'); 
            ptrGearContainerEl.style.transition = 'none'; 
        }

        function setSpokeOpacityBasedOnCount(count) { 
            if (ptrSpokeElements.length === 0 && NUM_SPOKES > 0) return;
            ptrSpokeElements.forEach((spoke, index) => {
                if (index < count) {
                    spoke.classList.add('visible');
                } else {
                    spoke.classList.remove('visible');
                }
            });
        }
        
        function startTrailingSpokePulseAnimation() {
            if (ptrSpokeElements.length !== NUM_SPOKES || NUM_SPOKES === 0) return;
            if (spokePulseIntervalId) clearInterval(spokePulseIntervalId);
            currentLeadingSpokeIndex = 0;

            spokePulseIntervalId = setInterval(() => {
                if (ptrAnimationPhase !== 'threshold_rotating' && ptrAnimationPhase !== 'spoke_pulsing') { 
                    clearInterval(spokePulseIntervalId);
                    spokePulseIntervalId = null;
                    return;
                }

                ptrSpokeElements.forEach((spoke, index) => {
                    let targetOpacity = SPOKE_PULSE_MIN_OPACITY; 
                    for (let i = 0; i < SPOKE_PULSE_TRAIL_LENGTH; i++) {
                        const trailSpokeIndex = (currentLeadingSpokeIndex - i + NUM_SPOKES) % NUM_SPOKES;
                        if (index === trailSpokeIndex) {
                            targetOpacity = SPOKE_PULSE_MAX_OPACITY - (i * SPOKE_PULSE_OPACITY_STEP);
                            break; 
                        }
                    }
                    spoke.style.opacity = Math.max(SPOKE_PULSE_MIN_OPACITY, targetOpacity).toFixed(2);
                    if (parseFloat(spoke.style.opacity) > SPOKE_PULSE_MIN_OPACITY + 0.01) {
                       if(!spoke.classList.contains('visible')) spoke.classList.add('visible');
                    } else {
                       if(spoke.classList.contains('visible')) spoke.classList.remove('visible');
                    }
                });
                currentLeadingSpokeIndex = (currentLeadingSpokeIndex + 1) % NUM_SPOKES;
            }, SPOKE_PULSE_INTERVAL);
        }
        
        function resetPtrVisuals(animated = true) { 
            clearAllPtrAnimations();
            ptrAnimationPhase = 'idle';

            ptrScrollView.style.transition = animated ? 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none';
            ptrScrollView.style.transform = 'translateY(0px)';
            
            ptrIndicator.classList.remove('ptr-visible');
            ptrIndicator.style.transform = ''; 
            ptrIndicator.style.transition = 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

            ptrGearContainerEl.style.transform = 'scale(1) rotate(0deg)'; 
            if (NUM_SPOKES > 0 && ptrSpokeElements.length > 0) {
                 ptrSpokeElements.forEach(spoke => {
                    spoke.classList.remove('visible'); 
                    spoke.style.opacity = ''; 
                });
            }
            
            ptrCurrentPullDistance = 0;
        }

        ptrScrollView.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) { ptrEligible = false; return; }
            
            clearAllPtrAnimations(); 
            ptrAnimationPhase = 'idle'; 
            
            ptrGearContainerEl.style.transform = 'scale(1) rotate(0deg)'; 
            if (NUM_SPOKES > 0 && ptrSpokeElements.length > 0) {
                 ptrSpokeElements.forEach(spoke => {
                    spoke.classList.remove('visible');
                    spoke.style.opacity = ''; 
                });
            }
            ptrIndicator.style.transition = 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)';


            if (ptrScrollView.scrollTop < 1) { 
                ptrEligible = true; ptrStartY = e.touches[0].clientY; ptrIsActive = false; 
                ptrCurrentPullDistance = 0;
                
                ptrScrollView.style.transition = 'none'; 
                ptrGearContainerEl.style.transition = 'none'; 
            } else {
                ptrEligible = false; ptrIsActive = false;
            }
        }, { passive: true });

        ptrScrollView.addEventListener('touchmove', (e) => {
            if (!ptrEligible || e.touches.length > 1) return;
            if (ptrScrollView.scrollTop > 0) { 
                if (ptrIsActive) resetPtrVisuals(true);
                ptrEligible = false; ptrIsActive = false;
                return;
            }
            
            const currentY = e.touches[0].clientY;
            const diffY = currentY - ptrStartY; 

            if (diffY < 0 || (diffY <= PTR_TOP_ACTIVATION_DRAG_THRESHOLD && !ptrIsActive) ) {
                if (ptrIsActive && diffY <= PTR_TOP_ACTIVATION_DRAG_THRESHOLD) {
                    resetPtrVisuals(true); ptrIsActive = false; 
                }
                return; 
            }
            if (!ptrIsActive) ptrIsActive = true; 
            e.preventDefault(); 

            ptrCurrentPullDistance = diffY; 
            const visualPullOfScrollView = Math.min(ptrCurrentPullDistance, PTR_TOP_MAX_PULL_VISUAL);
            ptrScrollView.style.transform = `translateY(${visualPullOfScrollView}px)`;

            ptrIndicator.classList.add('ptr-visible');
            let indicatorTranslateYValue = (visualPullOfScrollView / 2) - (PTR_INDICATOR_HEIGHT_VALUE / 2);
            indicatorTranslateYValue = Math.max(0, indicatorTranslateYValue); 
            indicatorTranslateYValue = Math.min(indicatorTranslateYValue, visualPullOfScrollView - PTR_INDICATOR_HEIGHT_VALUE * 0.5 + 10 );

            const indicatorPullProgress = Math.min(ptrCurrentPullDistance / PTR_TOP_THRESHOLD_REFRESH, 1.0);
            const currentIndicatorScale = 0.8 + (indicatorPullProgress * 0.2); 

            ptrIndicator.style.transform = `translateY(${indicatorTranslateYValue}px) scale(${currentIndicatorScale})`;
            ptrIndicator.style.transition = 'none'; 


            if (ptrCurrentPullDistance > PTR_TOP_THRESHOLD_REFRESH) {
                if (ptrAnimationPhase !== 'threshold_rotating' && ptrAnimationPhase !== 'spoke_pulsing') {
                    clearAllPtrAnimations(); 
                    ptrAnimationPhase = 'threshold_rotating';
                    if (NUM_SPOKES > 0 && ptrSpokeElements.length > 0) {
                        ptrSpokeElements.forEach(spoke => {
                            spoke.classList.add('visible'); // Make all spokes visible for rotation
                            spoke.style.opacity = SPOKE_PULSE_MAX_OPACITY; // Ensure they are bright
                        });
                    }
                    
                    thresholdRotateStartTime = performance.now();
                    ptrGearContainerEl.style.transform = 'rotate(0deg) scale(1)'; 
                    ptrGearContainerEl.style.transition = 'none'; 

                    // Start spoke pulsing after a delay, during the rotation
                    if (spokePulseStartTimeoutId) clearTimeout(spokePulseStartTimeoutId);
                    spokePulseStartTimeoutId = setTimeout(() => {
                        if (ptrIsActive && ptrCurrentPullDistance > PTR_TOP_THRESHOLD_REFRESH &&
                            (ptrAnimationPhase === 'threshold_rotating' || ptrAnimationPhase === 'spoke_pulsing')) {
                            
                            // If rotation phase is technically still 'threshold_rotating', update it as pulse is now primary driver
                            if(ptrAnimationPhase === 'threshold_rotating') ptrAnimationPhase = 'spoke_pulsing';

                            if (NUM_SPOKES > 0 && ptrSpokeElements.length === NUM_SPOKES) {
                                startTrailingSpokePulseAnimation();
                            }
                        }
                        spokePulseStartTimeoutId = null;
                    }, DELAY_BEFORE_SPOKE_PULSE);


                    function animateThresholdRotation() {
                        if (ptrAnimationPhase !== 'threshold_rotating' && ptrAnimationPhase !== 'spoke_pulsing') { 
                            if(thresholdRotateRafId) cancelAnimationFrame(thresholdRotateRafId);
                            thresholdRotateRafId = null;
                            return; 
                        }
                        const elapsedTime = performance.now() - thresholdRotateStartTime;
                        let rawProgress = elapsedTime / THRESHOLD_ROTATE_DURATION;
                        
                        let easedProgress = 1 - Math.pow(1 - rawProgress, 3); 
                        easedProgress = Math.min(easedProgress, 1.0); 

                        const currentRotation = easedProgress * THRESHOLD_ROTATE_DEGREES;
                        ptrGearContainerEl.style.transform = `rotate(${currentRotation}deg) scale(1)`;

                        if (rawProgress < 1.0 && ptrIsActive) { 
                            thresholdRotateRafId = requestAnimationFrame(animateThresholdRotation);
                        } else { 
                            thresholdRotateRafId = null;
                            // Rotation is done. If spoke pulse hasn't started yet (e.g. DELAY_BEFORE_SPOKE_PULSE > THRESHOLD_ROTATE_DURATION)
                            // and we are still in a valid state, start it now.
                            if (ptrIsActive && ptrAnimationPhase === 'threshold_rotating') { 
                                ptrAnimationPhase = 'spoke_pulsing'; 
                                ptrGearContainerEl.style.transform = `rotate(${THRESHOLD_ROTATE_DEGREES % 360}deg) scale(1)`; 
                                if (NUM_SPOKES > 0 && ptrSpokeElements.length === NUM_SPOKES && !spokePulseIntervalId) { 
                                    startTrailingSpokePulseAnimation();
                                }
                            } else if (ptrIsActive && ptrAnimationPhase === 'spoke_pulsing') {
                                // Ensure final rotation angle if pulse started mid-rotation and this is the natural end of rotation
                                ptrGearContainerEl.style.transform = `rotate(${THRESHOLD_ROTATE_DEGREES % 360}deg) scale(1)`;
                            }
                        }
                    }
                    if(thresholdRotateRafId) cancelAnimationFrame(thresholdRotateRafId); 
                    thresholdRotateRafId = requestAnimationFrame(animateThresholdRotation);
                }
            } else { 
                if (ptrAnimationPhase === 'threshold_rotating' || ptrAnimationPhase === 'spoke_pulsing') {
                    clearAllPtrAnimations();
                    ptrGearContainerEl.style.transform = 'scale(1) rotate(0deg)'; 
                }
                ptrAnimationPhase = 'spoke_loading'; 
                
                if (NUM_SPOKES > 0 && ptrSpokeElements.length === NUM_SPOKES) {
                    const pullRatioForSpokes = Math.min(ptrCurrentPullDistance / PTR_TOP_THRESHOLD_REFRESH, 1.0);
                    let spokesToShow = Math.floor(pullRatioForSpokes * NUM_SPOKES);
                    spokesToShow = Math.max(0, Math.min(spokesToShow, NUM_SPOKES));
                    setSpokeOpacityBasedOnCount(spokesToShow); 
                }
                ptrGearContainerEl.style.transform = 'scale(1) rotate(0deg)'; 
                
                if(ptrCurrentPullDistance < PTR_TOP_ACTIVATION_DRAG_THRESHOLD / 2 ) { 
                    ptrIndicator.classList.remove('ptr-visible');
                    if (ptrAnimationPhase !== 'idle') resetPtrVisuals(false); 
                }
            }
        }, { passive: false }); 

        ptrScrollView.addEventListener('touchend', () => {
            const wasEligibleForPTR = ptrEligible; 
            const wasPTRActive = ptrIsActive;     

            ptrEligible = false; ptrIsActive = false;
            clearAllPtrAnimations(); 
            ptrAnimationPhase = 'idle'; 

            ptrIndicator.style.transition = 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

            if (wasEligibleForPTR && wasPTRActive) {
                resetPtrVisuals(true);
            } else if (wasEligibleForPTR && 
                       ( (ptrScrollView.style.transform && ptrScrollView.style.transform !== 'translateY(0px)' && getComputedStyle(ptrScrollView).transform !== 'none') || 
                         (ptrIndicator.classList.contains('ptr-visible')) ) ) {
                resetPtrVisuals(true);
            }
        });

    } else {
        console.warn("Pull-to-refresh disabled: Required elements not found.");
    }
});