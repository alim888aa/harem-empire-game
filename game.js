// Main game logic
class HaremEmpireGame {
    constructor() {
        console.log('HaremEmpireGame constructor called');
        this.characters = new GameCharacters();
        this.player = {
            type: null,
            rank: null,
            supportPoints: 0,
            giftsRemaining: 15,
            season: 1,
            isAlive: true
        };
        this.rankProgression = {
            concubine: ['Concubine', 'Empress Consort', 'Emperor'],
            minister: ['Minister', 'Prime Minister', 'Emperor'],
            prince: ['Prince', 'Crown Prince', 'Emperor']
        };
        this.init();
    }

    init() {
        console.log('Initializing game');
        this.bindEvents();
        this.showCharacterSelection();
        console.log('Game initialization complete');
    }

    bindEvents() {
        console.log('Binding events');
        // Character selection
        const characterBtns = document.querySelectorAll('.character-btn');
        console.log('Found character buttons:', characterBtns.length);

        characterBtns.forEach(btn => {
            console.log('Binding event to button:', btn.dataset.type);
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const type = e.currentTarget.dataset.type;
                console.log('Button clicked, starting game with type:', type);
                this.startGame(type);
            });
        });

        // Game controls
        document.getElementById('next-season').addEventListener('click', () => {
            this.nextSeason();
        });

        // Modal controls
        document.getElementById('give-emperor-gifts').addEventListener('click', () => {
            this.giveEmperorGifts();
        });

        document.getElementById('refuse-emperor').addEventListener('click', () => {
            this.refuseEmperor();
        });

        document.getElementById('accept-promotion').addEventListener('click', () => {
            this.acceptPromotion();
        });

        document.getElementById('restart-game').addEventListener('click', () => {
            this.restartGame();
        });
    }

    startGame(type) {
        console.log('startGame called with:', type);
        this.player.type = type;
        this.player.rank = this.rankProgression[type][0];
        console.log('Player rank set to:', this.player.rank);
        this.updateUI();
        this.showGameScreen();
        this.renderCharacterInteractions();
    }

    showCharacterSelection() {
        document.getElementById('character-selection').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('hidden');
    }

    showGameScreen() {
        console.log('Showing game screen');
        const charSelection = document.getElementById('character-selection');
        const gameScreen = document.getElementById('game-screen');

        console.log('Character selection element:', charSelection);
        console.log('Character selection classes before:', charSelection.className);
        console.log('Game screen element:', gameScreen);
        console.log('Game screen classes before:', gameScreen.className);

        charSelection.classList.add('hidden');
        gameScreen.classList.remove('hidden');

        console.log('Character selection classes after:', charSelection.className);
        console.log('Game screen classes after:', gameScreen.className);
        console.log('Screen transition complete');
    }

    renderCharacterInteractions() {
        console.log('Rendering character interactions');
        const characterList = document.getElementById('character-list');
        console.log('Character list element:', characterList);
        characterList.innerHTML = '';

        const interactableChars = this.characters.getInteractableCharacters();
        console.log('Interactable characters:', interactableChars.length);

        interactableChars.forEach((character, index) => {
            console.log(`Creating character div ${index + 1}:`, character.name);
            const charDiv = document.createElement('div');
            charDiv.className = 'character-interaction';

            const giftCost = character.type === 'side' ? 5 : 1;
            const supportGain = 10;
            
            // NEW: Get personality hints
            const personalityHints = character.getPersonalityHints();

            charDiv.innerHTML = `
                <div class="character-info">
                    <h4>${character.name}</h4>
                    <p>Type: ${character.type}</p>
                    <p>Support: ${character.supportPoints}</p>
                    <p class="personality-hint" style="font-style: italic; color: #666;">
                        Personality: ${personalityHints}
                    </p>
                </div>
                <div class="character-actions">
                    <button class="gift-btn" data-character="${character.name}" data-cost="${giftCost}" data-support="${supportGain}">
                        Give Gift (${giftCost} gifts)
                    </button>
                    <button class="message-btn" data-character="${character.name}" data-cost="${giftCost}" data-support="${supportGain}">
                        Gift with Message (${giftCost} gifts)
                    </button>
                    <button class="spit-btn" data-character="${character.name}">
                        Spit in Face (-20 support)
                    </button>
                </div>
            `;

            characterList.appendChild(charDiv);
            console.log(`Appended character div for ${character.name}`);
        });

        console.log('All character divs created. Character list children:', characterList.children.length);

        // Bind interaction events
        document.querySelectorAll('.gift-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const character = e.target.dataset.character;
                const cost = parseInt(e.target.dataset.cost);
                const support = parseInt(e.target.dataset.support);
                this.giveGift(character, cost, support);
            });
        });

        document.querySelectorAll('.message-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const character = e.target.dataset.character;
                const cost = parseInt(e.target.dataset.cost);
                const support = parseInt(e.target.dataset.support);
                this.showMessageModal(character, cost, support);
            });
        });

        document.querySelectorAll('.spit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const character = e.target.dataset.character;
                this.spitInFace(character);
            });
        });
    }
    
    showMessageModal(characterName, cost, support) {
        // Create modal HTML
        const modalHTML = `
            <div id="message-modal" class="modal">
                <div class="modal-content">
                    <h3>Send Message to ${characterName}</h3>
                    <p>What would you like to say with your gift?</p>
                    <textarea id="player-message" placeholder="Enter your message here..." style="width: 100%; height: 100px; margin: 10px 0;"></textarea>
                    <p style="font-size: 12px; color: #666;">
                        Tip: Try words like "change", "weak", "honor", "serve", "dangerous", etc. to see different reactions!
                    </p>
                    <div class="message-actions">
                        <button id="send-message">Send Gift with Message</button>
                        <button id="cancel-message">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Bind modal events
        document.getElementById('send-message').addEventListener('click', () => {
            const message = document.getElementById('player-message').value.trim();
            if (message) {
                this.giveGift(characterName, cost, support, message);
            } else {
                alert('Please enter a message!');
                return;
            }
            document.getElementById('message-modal').remove();
        });
        
        document.getElementById('cancel-message').addEventListener('click', () => {
            document.getElementById('message-modal').remove();
        });
        
        // Focus on textarea
        setTimeout(() => {
            document.getElementById('player-message').focus();
        }, 100);
    }

    giveGift(characterName, cost, supportGain, playerMessage = "") {
        if (this.player.giftsRemaining >= cost) {
            const character = this.characters.getCharacter(characterName);
            
            // NEW: Vector-based response calculation
            let actualSupportGain = supportGain;
            let characterResponse = "";
            
            if (playerMessage) {
                const response = this.analyzeMessage(playerMessage, character.vector);
                
                // Apply vector changes
                character.updateVector(response.vectorChanges);
                
                // Modify support gain based on message
                actualSupportGain = Math.round(supportGain * response.supportMultiplier);
                
                // Get character response
                characterResponse = this.getResponseByType(character, response.responseType);
            }
            
            this.player.giftsRemaining -= cost;
            this.characters.giveSupport(characterName, actualSupportGain);
            
            // Show character response if there was a message
            if (characterResponse) {
                setTimeout(() => {
                    alert(characterResponse);
                }, 100);
            }
            
            this.updateUI();
            this.renderCharacterInteractions();
        } else {
            alert('Not enough gifts remaining!');
        }
    }
    
    analyzeMessage(message, characterVector) {
        const lowerMessage = message.toLowerCase();
        let vectorChanges = {};
        let supportMultiplier = 1;
        let responseType = 'neutral';
        
        // Define keyword categories
        const rebelliousWords = ['change', 'weak', 'revolution', 'overthrow', 'corrupt', 'failing', 'reform'];
        const loyalWords = ['honor', 'serve', 'emperor', 'duty', 'faithful', 'empire', 'tradition'];
        const fearWords = ['dangerous', 'careful', 'secret', 'risk', 'enemies', 'watch'];
        
        const hasRebellious = rebelliousWords.some(word => lowerMessage.includes(word));
        const hasLoyal = loyalWords.some(word => lowerMessage.includes(word));
        const hasFear = fearWords.some(word => lowerMessage.includes(word));
        
        if (hasRebellious) {
            if (characterVector.ambition > 0.6 && characterVector.loyalty < 0.5) {
                // Rebel-minded character likes rebellious talk
                vectorChanges.trust = 0.2;
                vectorChanges.ambition = 0.1;
                supportMultiplier = 2;
                responseType = 'rebel_positive';
            } else if (characterVector.loyalty > 0.7) {
                // Loyal character is suspicious of rebellious talk
                vectorChanges.trust = -0.3;
                vectorChanges.fear = 0.2;
                supportMultiplier = 0.3;
                responseType = 'loyal_suspicious';
            }
        }
        
        if (hasLoyal) {
            if (characterVector.loyalty > 0.6) {
                // Loyal character appreciates loyal talk
                vectorChanges.trust = 0.2;
                supportMultiplier = 1.5;
                responseType = 'loyal_positive';
            } else if (characterVector.ambition > 0.7 && characterVector.loyalty < 0.4) {
                // Ambitious, disloyal character sees loyal talk as naive
                vectorChanges.trust = -0.1;
                supportMultiplier = 0.7;
                responseType = 'ambitious_dismissive';
            }
        }
        
        if (hasFear) {
            if (characterVector.fear > 0.6) {
                // Fearful character appreciates caution
                vectorChanges.trust = 0.1;
                vectorChanges.fear = -0.1; // Feels safer
                supportMultiplier = 1.3;
                responseType = 'fearful_appreciative';
            }
        }
        
        return { vectorChanges, supportMultiplier, responseType };
    }
    
    getResponseByType(character, responseType) {
        const responses = {
            rebel_positive: [
                `${character.name}: "Finally, someone who sees the truth! These are dangerous words, but necessary ones."`,
                `${character.name}: "Your courage in speaking such thoughts... perhaps we understand each other."`,
                `${character.name}: "The current order is indeed fragile. We should discuss this further."`
            ],
            loyal_suspicious: [
                `${character.name}: "Such talk makes me very uncomfortable. I hope you're not serious about this."`,
                `${character.name}: "I... I think we should speak of other matters. The walls have ears."`,
                `${character.name}: "Your words border on treason. I cannot support such thinking."`
            ],
            loyal_positive: [
                `${character.name}: "Your loyalty to the empire is admirable. We need more people like you."`,
                `${character.name}: "It's refreshing to meet someone who understands duty and honor."`,
                `${character.name}: "The empire is blessed to have servants like you."`
            ],
            ambitious_dismissive: [
                `${character.name}: "Such noble words... though I wonder if you truly understand how power works."`,
                `${character.name}: "Loyalty is admirable, but perhaps naive in these times."`,
                `${character.name}: "Your idealism is... charming."`
            ],
            fearful_appreciative: [
                `${character.name}: "Yes, we must be very careful. Thank you for understanding the dangers."`,
                `${character.name}: "Finally, someone who sees the risks we all face."`,
                `${character.name}: "Your caution shows wisdom. We must watch our steps."`
            ],
            neutral: [
                `${character.name}: "Thank you for the gift. Your words are... interesting."`,
                `${character.name}: "I appreciate your generosity and your thoughts."`,
                `${character.name}: "Your gift is welcome, as are your words."`
            ]
        };
        
        const responseList = responses[responseType] || responses.neutral;
        return responseList[Math.floor(Math.random() * responseList.length)];
    }

    spitInFace(characterName) {
        this.characters.removeSupport(characterName, 20);
        this.updateUI();
        this.renderCharacterInteractions();
    }

    nextSeason() {
        console.log('nextSeason called, current season:', this.player.season);
        // Check for emperor encounter (30% chance, but only from season 2 onwards)
        if (this.player.season >= 2 && Math.random() < 0.3) {
            console.log('Emperor encounter triggered');
            this.showEmperorEncounter();
            return;
        }

        console.log('No emperor encounter, advancing season');
        this.advanceSeason();
    }

    advanceSeason() {
        console.log('advanceSeason called, current season before increment:', this.player.season);
        this.player.season++;
        this.player.giftsRemaining += 15; // Add 15 gifts to existing gifts
        console.log('Season incremented to:', this.player.season);
        console.log('Gifts after adding 15:', this.player.giftsRemaining);

        // Alert for new season
        alert(`Season ${this.player.season} begins! You have 15 new gifts to distribute.`);

        // Calculate total support points
        this.calculateTotalSupport();

        // Check for promotion
        this.checkPromotion();

        this.updateUI();
        this.renderCharacterInteractions();
    }

    calculateTotalSupport() {
        let systemSupport = 0;

        this.characters.getAllCharacters().forEach(char => {
            if (char.isAlive && char.type !== 'emperor') {
                // Only count system support when characters reach 100+ support points
                if (char.supportPoints >= 100) {
                    if (char.type === 'side') {
                        systemSupport += 25;
                    } else if (char.type === 'minor') {
                        systemSupport += 5;
                    }
                }
            }
        });

        this.player.supportPoints = systemSupport;

        if (systemSupport > 0) {
            console.log(`System support earned: ${systemSupport} points`);
        }
    }

    checkPromotion() {
        const currentRankIndex = this.rankProgression[this.player.type].indexOf(this.player.rank);
        const nextRank = this.rankProgression[this.player.type][currentRankIndex + 1];

        if (nextRank && this.player.supportPoints >= 100) {
            if (nextRank === 'Emperor') {
                this.showVictory();
                return;
            }

            // Replace current holder of the position
            this.replaceCurrentHolder(nextRank);
            this.showPromotionModal(nextRank);
        }
    }

    replaceCurrentHolder(newRank) {
        // Remove the current holder of this position
        const currentHolder = this.characters.getAllCharacters().find(char =>
            char.name.includes(newRank) ||
            (newRank === 'Empress Consort' && char.name === 'Empress Consort') ||
            (newRank === 'Prime Minister' && char.name === 'Prime Minister') ||
            (newRank === 'Crown Prince' && char.name === 'Crown Prince')
        );

        if (currentHolder) {
            this.characters.removeCharacter(currentHolder.name);
        }
    }

    showEmperorEncounter() {
        document.getElementById('emperor-encounter').classList.remove('hidden');
    }

    giveEmperorGifts() {
        if (this.player.giftsRemaining >= 10) {
            this.player.giftsRemaining -= 10;
            document.getElementById('emperor-encounter').classList.add('hidden');
            this.advanceSeason();
        } else {
            alert('You need 10 gifts to satisfy the Emperor!');
            this.showGameOver('Execution', 'You failed to provide enough gifts to the Emperor and were executed.');
        }
    }

    refuseEmperor() {
        this.showGameOver('Execution', 'You refused the Emperor and were executed for your insolence.');
    }

    showPromotionModal(newRank) {
        document.getElementById('promotion-text').textContent =
            `You have gained enough support to become ${newRank}! You have replaced the previous holder.`;
        document.getElementById('promotion-modal').classList.remove('hidden');
        this.pendingPromotion = newRank;
    }

    acceptPromotion() {
        this.player.rank = this.pendingPromotion;
        this.player.supportPoints = 0; // Reset support points after promotion

        // Reset all character support points
        this.characters.getAllCharacters().forEach(char => {
            char.supportPoints = 0;
        });

        document.getElementById('promotion-modal').classList.add('hidden');
        this.updateUI();
        this.renderCharacterInteractions();
    }

    showVictory() {
        this.showGameOver('Victory!', 'Congratulations! You have overthrown the Emperor and now rule the empire!');
    }

    showGameOver(title, message) {
        document.getElementById('game-over-title').textContent = title;
        document.getElementById('game-over-text').textContent = message;
        document.getElementById('game-over').classList.remove('hidden');
        this.player.isAlive = false;
    }

    restartGame() {
        // Reset game state
        this.characters = new GameCharacters();
        this.player = {
            type: null,
            rank: null,
            supportPoints: 0,
            giftsRemaining: 15,
            season: 1,
            isAlive: true
        };

        // Hide modals and show character selection
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });

        this.showCharacterSelection();
    }

    updateUI() {
        console.log('Updating UI with player data:', this.player);
        document.getElementById('season-counter').textContent = `Season ${this.player.season}`;
        document.getElementById('support-points').textContent = `Support: ${this.player.supportPoints}`;
        document.getElementById('gifts-remaining').textContent = `Gifts: ${this.player.giftsRemaining}`;
        document.getElementById('player-rank').textContent = `Rank: ${this.player.rank || 'None'}`;
        console.log('UI updated');
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game');
    window.game = new HaremEmpireGame();
    console.log('Game initialized');
});