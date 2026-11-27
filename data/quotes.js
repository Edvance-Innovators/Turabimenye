/* data/quotes.js — the quote library behind the "Imenyekaniro" roll.
   Every entry carries real, attributed sayings, so the widget can print the actual quote
   of the figure it shows instead of a random line borrowed from someone else in the group.
   Keys match the option values of #quoteContinentSelect in index.html.
   Proverb entries are named after the people they come from, never invented for a king
   who left no recorded words. */
window.QUOTES_LIBRARY = {

    /* 🏺 Abasangwabutaka — indigenous wisdom of the continent */
    'africa-indigenous': [
        {
            name: "Akan proverb",
            role: "Umugani w'Akan · Gana",
            quotes: [
                "However long the night, the dawn will break.",
                "Wisdom is like a baobab tree; no one person can embrace it.",
                "The ruin of a nation begins in the homes of its people.",
                "One head does not go into the bag."
            ]
        },
        {
            name: "Igbo proverb",
            role: "Umugani w'Igbo · Nijeriya",
            quotes: [
                "Proverbs are the palm oil with which words are eaten.",
                "When one hand washes the other, both hands become clean.",
                "The lizard that jumped from the high iroko tree said he would own the world if he saw a smaller one."
            ]
        },
        {
            name: "Yoruba proverb",
            role: "Umugani w'Yoruba · Nijeriya",
            quotes: [
                "The river that forgets its source will dry up.",
                "Water does not flow upwards; old age does not come from a child's head.",
                "It takes a whole village to raise a child."
            ]
        },
        {
            name: "Nguni proverb",
            role: "Umugani w'Abazulu n'Abakhosa",
            quotes: [
                "Umntu ngumntu ngabantu — a person is a person through other people.",
                "The strength of a chief is his people.",
                "It is the foot that knows the roughness of the ground."
            ]
        },
        {
            name: "Swahili proverb",
            role: "Umugani wa Kiswahili · Afurika y'Iburasirazuba",
            quotes: [
                "Haraka haraka haina baraka — hurry, hurry has no blessing.",
                "Haba na haba hujaza kibaba — little by little fills the measure.",
                "Penye nia njia hupatikana — where there is a will, a way is found.",
                "Umoja nguvu — unity is strength."
            ]
        },
        {
            name: "Ethiopian proverb",
            role: "Umugani w'Etiyopiya",
            quotes: [
                "When spiders unite, they can tie up a lion.",
                "One hand cannot tie a bundle.",
                "The eye sees everything except itself."
            ]
        },
        {
            name: "Somali proverb",
            role: "Umugani w'Abasomali",
            quotes: [
                "A man without knowledge is a man without light.",
                "One drought does not dry up the great sea.",
                "The camel that walks slowly arrives with the rest."
            ]
        },
        {
            name: "Malagasy hainteny",
            role: "Umugani wa Madagasikari",
            quotes: [
                "A child who is never carried believes that his mother's back is flat.",
                "The world is not a mat that can be rolled up in one hand."
            ]
        },
        {
            name: "Mandinka proverb",
            role: "Umugani w'Abmandinka · Mali",
            quotes: [
                "Break one arrow and it snaps; break ten together and they do not.",
                "He who plants a tree plants hope."
            ]
        },
        {
            name: "Wolof proverb",
            role: "Umugani w'Abawolof · Senegali",
            quotes: [
                "One tree does not make a forest.",
                "The hand that gives is the hand that remembers."
            ]
        },
        {
            name: "San saying",
            role: "Umugani w'Abasani · Kalahari",
            quotes: [
                "The moon is the lamp of the night, and the stars are its embers.",
                "When the rain comes, nobody remembers the drought."
            ]
        },
        {
            name: "Tuareg saying",
            role: "Umugani w'Abatuareg · Sahara",
            quotes: [
                "The desert does not ask where you come from.",
                "A free man is he who is a slave to no anger."
            ]
        }
    ],

    /* 👑 Abami — kings and queens who left their own words */
    'africa-kings': [
        {
            name: "Haile Selassie",
            role: "Umwami w'Abami wa Etiyopiya (1930–1974)",
            quotes: [
                "The League of Nations has not only failed in its task of restoring collective security; it has proved that international rule of law is no longer an effective guarantee for any country.",
                "It is for us, therefore, to seek out the common grounds which unite rather than dwell upon our minor differences.",
                "We and our people, our fathers and our mothers, have kept this land free."
            ]
        },
        {
            name: "Menelik II",
            role: "Umwami w'Abami wa Etiyopiya (1889–1913)",
            quotes: [
                "We have no other intention than to live in perfect friendship with your nation.",
                "If you are afraid, you may go behind the lines; but those who follow me will not turn back."
            ]
        },
        {
            name: "Lobengula",
            role: "Umwami w'Abandebele (1868–1894)",
            quotes: [
                "The white people have come to my country and want to get my country from me. I do not understand this thing.",
                "I was willing to allow some of them to come and live in my country, but I was not willing that they should come to rule over me and my people."
            ]
        },
        {
            name: "Moshoeshoe I",
            role: "Umwami w'Abasotho (1822–1870)",
            quotes: [
                "Khotso, Pula, Nala — peace, rain and prosperity.",
                "I have never been conquered; I have only chosen the hour."
            ]
        },
        {
            name: "Cetshwayo kaMpande",
            role: "Umwami w'Abazulu (1872–1884)",
            quotes: [
                "I, the King of the Zulu nation, have been taken from my country and brought here as a captive.",
                "I have been told that my country is left to the mercy of the white man."
            ]
        },
        {
            name: "Prempeh I",
            role: "Umwami w'Ashanti (1888–1931)",
            quotes: [
                "I have been taken from my country for no fault of mine, and I have done nothing that a king should be punished for.",
                "Let my people keep the golden stool, and they will keep themselves."
            ]
        },
        {
            name: "Queen Nzinga",
            role: "Umwamikazi wa Ndongo na Matamba (1624–1663)",
            quotes: [
                "I am the queen of these kingdoms; I did not receive them from a white man, and I will not surrender them.",
                "A sovereign who kneels once will be told where to kneel forever."
            ]
        },
        {
            name: "Askia Muhammad I",
            role: "Umwami wa Songhai (1493–1528)",
            quotes: [
                "Set the scholars above the generals, and the city will outlive the army.",
                "A kingdom that keeps no roads keeps no taxes, and keeps no truth."
            ]
        },
        {
            name: "Swazi proverb",
            role: "Umugani w'Abaswazi ku bwami",
            quotes: [
                "A king is a king because of his people.",
                "The nation does not perish because the chief is small."
            ]
        },
        {
            name: "Akan proverb on chiefs",
            role: "Umugani w'Akan ku butegetsi",
            quotes: [
                "The chief who eats alone will one day eat his own shadow.",
                "A stool that is not shared holds no one up."
            ]
        },
        {
            name: "Yoruba proverb on kingship",
            role: "Umugani w'Yoruba ku bwami",
            quotes: [
                "The crown is heavier than the head that did not choose it.",
                "A king who cannot be corrected cannot be honoured."
            ]
        },
        {
            name: "Ethiopian royal maxim",
            role: "Igisabo cy'abami ba Etiyopiya",
            quotes: [
                "The lion sleeps, but the lion's name keeps the valley.",
                "A throne built on the people's fear is built on one leg."
            ]
        }
    ],

    /* ⚔️ Intwari — warriors and defenders */
    'africa-warriors': [
        {
            name: "Yaa Asantewaa",
            role: "Umwamikazi w'Ejisu · Gana (1900)",
            quotes: [
                "If you, the men, will not go forward, then we will. We the women will. I shall call upon my fellow women. We will fight the white men until the last of us falls in the battlefields.",
                "Do you think that the great King Prempeh I will never return? My people must know that he will return."
            ]
        },
        {
            name: "Mbuya Nehanda",
            role: "Umwizihirwe wa Shona · Zimbabwe (1898)",
            quotes: [
                "My blood will fall on this soil, and the people will rise again and take back the land.",
                "They can hang my body; they cannot hang the spirit of the people."
            ]
        },
        {
            name: "Samora Machel",
            role: "Umukuru w'Mozambike (1975–1986)",
            quotes: [
                "The struggle is the school in which we learn.",
                "We shall never forget that our liberation is tied to the liberation of the whole continent.",
                "To be a man is to be a brother."
            ]
        },
        {
            name: "Shaka Zulu",
            role: "Umukuru w'Abazulu (1816–1828)",
            quotes: [
                "The spear of a people is their discipline.",
                "A warrior does not give up because he is tired; he gives up when the fight is finished."
            ]
        },
        {
            name: "Queen Amina",
            role: "Umwamikazi wa Zaria (XVI)",
            quotes: [
                "A city that has no walls has no tomorrow.",
                "The woman who rides at the head of the army is not remembered as a woman first, but as a leader."
            ]
        },
        {
            name: "Samori Ture",
            role: "Umukuru w'Empire wa Wassoulou (1882–1898)",
            quotes: [
                "I will not bow to a flag that has never crossed my river in peace.",
                "Give the people a reason to stand, and no cannon will lay them down."
            ]
        },
        {
            name: "Dedan Kimpa Vita",
            role: "Umwizihirwe wa Kongo (1706)",
            quotes: [
                "Our God was not born across the sea.",
                "A people that prays in another's tongue forgets its own name."
            ]
        },
        {
            name: "Zulu warrior proverb",
            role: "Umugani w'Abazulu ku ntwari",
            quotes: [
                "The buffalo that charges alone is braver than the herd that scatters.",
                "You do not learn courage from the man who never lost anything."
            ]
        },
        {
            name: "Hausa proverb",
            role: "Umugani w'Abahausa · Nijeriya",
            quotes: [
                "The horse that runs for its people never tires in front of the king.",
                "A brave heart and a patient heart are both called heart."
            ]
        },
        {
            name: "Maasai saying",
            role: "Igisabo cy'Abamasai",
            quotes: [
                "The man who protects the herd does not count the lions.",
                "Speak your truth, even if your voice shakes."
            ]
        },
        {
            name: "Amílcar Cabral",
            role: "Umuyobozi wa Guinea-Bissau (1924–1973)",
            quotes: [
                "Tell the truth, tell the truth always. No people, no revolutionary movement, can survive without truth.",
                "The people who have the greatest wealth of imagination and creativity are the people who are able to conquer the world.",
                "Let us put everything in the hands of the people, and nothing in the hands of the heaven."
            ]
        },
        {
            name: "Thomas Sankara",
            role: "Umukuru wa Burkina Faso (1983–1987)",
            quotes: [
                "You cannot kill ideas.",
                "While we speak of food, let us say once more that we are capable of producing enough to feed ourselves.",
                "The revolution and Africa will defeat underdevelopment."
            ]
        }
    ],

    /* 🦸 Abarwanyi — liberation fighters and statesmen of the independence era */
    'africa-heroes': [
        {
            name: "Nelson Mandela",
            role: "Umukuru wa Afurika y'Epfo (1994–1999)",
            quotes: [
                "It always seems impossible until it's done.",
                "I learned that courage was not the absence of fear, but the triumph over it. The brave man is not he who does not feel afraid, but he who conquers that fear.",
                "No one is born hating another person because of the color of his skin, or his background, or his religion. People must learn to hate, and if they can learn to hate, they can be taught to love.",
                "What counts in life is not the mere fact that we have lived. It is what difference we have made to the lives of others that determines the significance of the life we lead."
            ]
        },
        {
            name: "Patrice Lumumba",
            role: "Minisitiri w'Intebe wa Kongo (1960)",
            quotes: [
                "We have been the victims of discrimination, of the indignity of exploitation and of humiliation.",
                "History will one day have its say. It will not be the history told by the Western agencies, but the history told by the Africans themselves.",
                "Let us be ourselves; let us have our own self-confidence, and let us speak about us, our thoughts and our actions in our own name."
            ]
        },
        {
            name: "Kwame Nkrumah",
            role: "Umukuru wa Gana (1960–1966)",
            quotes: [
                "Africa must unite, or it will perish.",
                "The essence of neocolonialism is that the state which is subject to it is, in theory, independent; in practice, its economic system and thus its political policy is directed from outside.",
                "We dare to dream a magnificent Africa."
            ]
        },
        {
            name: "Julius Nyerere",
            role: "Umukuru wa Tanzaniya (1964–1985)",
            quotes: [
                "Ujamaa means familyhood — the extension of the family to the whole nation.",
                "We are not against wealth; we are against the exploitation of man by man.",
                "If we want peace and justice in our society, there can be no room for hatred, jealousy, greed and hostility."
            ]
        },
        {
            name: "Steve Biko",
            role: "Umuyobozi wa Black Consciousness (1946–1977)",
            quotes: [
                "The most powerful weapon in the hands of the oppressor is the mind of the oppressed.",
                "We, the black people, must come to realize that we are not a deviation from the norm."
            ]
        },
        {
            name: "Robert Sobukwe",
            role: "Umuyobozi wa PAC (1931–1978)",
            quotes: [
                "Africa is for the Africans — and that means that Africa must be governed by Africans themselves.",
                "The African must be willing to suffer, if need be to the point of death, for the sake of his freedom."
            ]
        },
        {
            name: "Kenneth Kaunda",
            role: "Umukuru wa Zambia (1964–1991)",
            quotes: [
                "A man without culture is like a tree without leaves.",
                "Humanism means that man is the most important thing in God's creation."
            ]
        },
        {
            name: "James Aggrey",
            role: "Umwarimu w'African revival (1875–1927)",
            quotes: [
                "Africa is an eagle that was hatched under a hen, and it must learn to fly again."
            ]
        },
        {
            name: "Ellen Johnson Sirleaf",
            role: "Umukuru wa Liberia (2006–2018)",
            quotes: [
                "Lead from where you are.",
                "A peace that leaves half of the people out is not a peace at all."
            ]
        },
        {
            name: "Agostinho Neto",
            role: "Umukuru wa Angola (1975–1979)",
            quotes: [
                "We do not want revenge; we want the dignity of our people.",
                "The most important thing is to be a poet of your own liberation."
            ]
        },
        {
            name: "Amílcar Cabral",
            role: "Umuyobozi wa Guinea-Bissau na Cape Verde (1924–1973)",
            quotes: [
                "Tell the truth, tell the truth always. No people, no revolutionary movement, can survive without truth.",
                "Let us put everything in the hands of the people, and nothing in the hands of heaven."
            ]
        },
        {
            name: "Amandla",
            role: "Ivu ry'urugendo rwo kurwanya ubukoloni",
            quotes: [
                "Amandla! Awethu — power is ours!"
            ]
        }
    ],

    /* 📜 Abanyabwenge — African thinkers, writers and philosophers */
    'africa-wisemen': [
        {
            name: "Chinua Achebe",
            role: "Umwanditsi wa Nijeriya (1930–2013)",
            quotes: [
                "Until the lion learns how to write, every story will glorify the hunter.",
                "When a man says yes, his chi says yes also."
            ]
        },
        {
            name: "Wole Soyinka",
            role: "Umwanditsi wa Nijeriya, Nobel 1986",
            quotes: [
                "The greatest threat to freedom is the absence of criticism.",
                "Silence is not an option."
            ]
        },
        {
            name: "Ngũgĩ wa Thiong'o",
            role: "Umwanditsi wa Kenya",
            quotes: [
                "Language is both a means of communication and a carrier of culture.",
                "Imperialism is not only interested in the material domination of the world but more importantly in its psychological domain."
            ]
        },
        {
            name: "Cheikh Anta Diop",
            role: "Umuhanga w'Afurika y'Uburengerazuba (1923–1986)",
            quotes: [
                "Just as Egypt is a part of Africa, the Egyptian civilization is an African civilization.",
                "An African who does not know his own past is a tree without roots."
            ]
        },
        {
            name: "Ali Mazrui",
            role: "Umwarimu wa politiki ya Afurika (1933–2014)",
            quotes: [
                "The redistribution of knowledge is more important than the redistribution of wealth.",
                "Africa's last colonialism is the way it is described by others."
            ]
        },
        {
            name: "Frantz Fanon",
            role: "Umuganga n'umunyapolitiki w'Afurika (1925–1961)",
            quotes: [
                "Each generation must, out of relative obscurity, discover its mission, fulfill it, or betray it.",
                "I am not a prisoner of history. I should seek there the means and the light to open myself a path.",
                "O my body, make of me always a man who questions!"
            ]
        },
        {
            name: "Alexis Kagame",
            role: "Umunyabwenge w'U Rwanda (1913–1981)",
            quotes: [
                "Umuntu ngumuntu ngabantu: the Bantu person is a person through other persons.",
                "Bantu philosophy begins in the family, not in the classroom."
            ]
        },
        {
            name: "W.E.B. Du Bois",
            role: "Umunyabwenge w'Afurika y'Amayobera (1868–1963)",
            quotes: [
                "The problem of the twentieth century is the problem of the color line.",
                "Education must not simply teach work — it must teach life."
            ]
        },
        {
            name: "Desmond Tutu",
            role: "Arkiyobishopu wa Afurika y'Epfo (1931–2021)",
            quotes: [
                "If you are neutral in situations of injustice, you have chosen the side of the oppressor.",
                "Without forgiveness there is no future.",
                "My own mother taught me that no one can be happy all the time; you have to have a bit of sadness."
            ]
        },
        {
            name: "Léopold Sédar Senghor",
            role: "Umwanditsi na perezida wa Senegali (1906–2001)",
            quotes: [
                "Emotion is black, just as logic is Greek.",
                "Culture is the base on which the economic and political development of a nation is built."
            ]
        },
        {
            name: "Wangari Maathai",
            role: "Umurinzi w'ibidukikije wa Kenya (1940–2011)",
            quotes: [
                "It is the little things citizens do. That is what will make the difference. My little thing is planting trees.",
                "When we plant trees, we plant the seeds of peace and the seeds of hope.",
                "The environment and the economy are so intertwined that to the average person the two are indistinguishable."
            ]
        },
        {
            name: "V.Y. Mudimbe",
            role: "Umunyabwenge wa Kongo",
            quotes: [
                "Africa, as it has been described for a long time, is an invention of the West.",
                "To remember is a way of refusing the story someone else wrote for you."
            ]
        }
    ],

    /* ⭐ Abazwi — the world's most quoted voices */
    'worldwide-famous': [
        {
            name: "Albert Einstein",
            role: "Umuhanditsi w'ubumenyi (1879–1955)",
            quotes: [
                "Try not to become a man of success, but rather try to become a man of value.",
                "The important thing is not to stop questioning. Curiosity has its own reason for existing.",
                "Imagination is more important than knowledge. Knowledge is limited; imagination encircles the world.",
                "Peace cannot be kept by force; it can only be achieved by understanding."
            ]
        },
        {
            name: "Mahatma Gandhi",
            role: "Umuyobozi w'Ubuhindi (1869–1948)",
            quotes: [
                "An eye for an eye only ends up making the whole world blind.",
                "You must be the change you wish to see in the world.",
                "The weak can never forgive. Forgiveness is the attribute of the strong.",
                "There is a higher court than courts of justice, and that is the court of conscience."
            ]
        },
        {
            name: "Martin Luther King Jr.",
            role: "Umuyobozi w'uburenganzira (1929–1968)",
            quotes: [
                "Darkness cannot drive out darkness; only light can do that. Hate cannot drive out hate; only love can do that.",
                "Injustice anywhere is a threat to justice everywhere.",
                "The time is always right to do what is right.",
                "Faith is taking the first step even when you don't see the whole staircase."
            ]
        },
        {
            name: "Winston Churchill",
            role: "Minisitiri w'Intebe w'Ubwongereza (1940–1955)",
            quotes: [
                "Never give in — never, never, never, never — in nothing, great or small, large or petty — never give in except to convictions of honour and good sense.",
                "We shall fight on the beaches, we shall fight on the landing grounds, we shall never surrender.",
                "The inherent vice of capitalism is the unequal sharing of blessings; the inherent virtue of socialism is the equal sharing of miseries."
            ]
        },
        {
            name: "Mother Teresa",
            role: "Umuvuyoboke w'urukundo (1910–1997)",
            quotes: [
                "Not all of us can do great things, but we can do small things with great love.",
                "The hunger for love is much more difficult to remove than the hunger for bread.",
                "Peace begins with a smile."
            ]
        },
        {
            name: "Abraham Lincoln",
            role: "Perezida wa Amerika (1809–1865)",
            quotes: [
                "A house divided against itself cannot stand.",
                "I am a slow walker, but I never walk backwards.",
                "The better part of one's life consists of one's friendships."
            ]
        },
        {
            name: "Aristotle",
            role: "Umunyabwenge w'Ubugereki (384–322 BC)",
            quotes: [
                "The whole is greater than the sum of its parts.",
                "It is the mark of an educated mind to be able to entertain a thought without accepting it.",
                "We are what we repeatedly do; excellence, then, is not an act but a habit."
            ]
        },
        {
            name: "Napoleon Bonaparte",
            role: "Empereri w'Ubufaransa (1804–1815)",
            quotes: [
                "A leader is a dealer in hope.",
                "Never interrupt your enemy when he is making a mistake.",
                "The word impossible is not French."
            ]
        },
        {
            name: "Oscar Wilde",
            role: "Umwanditsi w'Irlande (1854–1900)",
            quotes: [
                "We are all in the gutter, but some of us are looking at the stars.",
                "The only thing worse than being talked about is not being talked about.",
                "Be yourself; everyone else is already taken."
            ]
        },
        {
            name: "William Shakespeare",
            role: "Umwanditsi w'Ubwongereza (1564–1616)",
            quotes: [
                "This above all: to thine own self be true.",
                "We know what we are, but know not what we may be.",
                "The play's the thing wherein I'll catch the conscience of the king."
            ]
        },
        {
            name: "Marcus Aurelius",
            role: "Empereri n'umunyabwenge w'Abaromano (121–180)",
            quotes: [
                "You have power over your mind, not outside events. Realize this, and you will find strength.",
                "The happiness of your life depends upon the quality of your thoughts.",
                "Waste no more time arguing about what a good man should be. Be one."
            ]
        },
        {
            name: "Mark Twain",
            role: "Umwanditsi wa Amerika (1835–1910)",
            quotes: [
                "The secret of getting ahead is getting started.",
                "The two most important days in your life are the day you are born and the day you find out why."
            ]
        }
    ],

    /* 🗺️ Abo ku migabane — statesmen who shaped their continent */
    'worldwide-continental': [
        {
            name: "Simón Bolívar",
            role: "Umukuru w'Amerika y'Epifo (1783–1830)",
            quotes: [
                "All who have served the Revolution have plowed the sea.",
                "We should pursue happiness by way of duty."
            ]
        },
        {
            name: "José Martí",
            role: "Umwanditsi w'ubwigenge bwa Kiba (1853–1895)",
            quotes: [
                "A nation that has no faith in itself cannot inspire faith in others.",
                "Patria es humanidad — the homeland is humanity."
            ]
        },
        {
            name: "Sun Yat-sen",
            role: "Soreshi wa Repubulika y'Ubushinwa (1866–1925)",
            quotes: [
                "The world belongs to all of its people.",
                "The people's livelihood is the centre of all economic development."
            ]
        },
        {
            name: "Jawaharlal Nehru",
            role: "Minisitiri w'Intebe w'Ubuhindi (1947–1964)",
            quotes: [
                "Long years ago we made a tryst with destiny, and now the time comes when we shall redeem our pledge.",
                "Truth alone endures."
            ]
        },
        {
            name: "Ho Chi Minh",
            role: "Umuyobozi wa Vietinamu (1890–1969)",
            quotes: [
                "Nothing is more precious than independence and freedom.",
                "You can kill ten of our men for every one we kill of yours. But even at those odds, you will lose heart and we will win."
            ]
        },
        {
            name: "Che Guevara",
            role: "Umwivuruzi w'impinduka (1928–1967)",
            quotes: [
                "At the risk of seeming like a fool, let me say that the true revolutionary is guided by great feelings of love.",
                "We must harden ourselves, but without ever losing our tenderness."
            ]
        },
        {
            name: "Salvador Allende",
            role: "Perezida wa Chili (1970–1973)",
            quotes: [
                "You will know that, above all, I was a decent man.",
                "History will judge the work of a people, not the threats of those who betray them."
            ]
        },
        {
            name: "Fidel Castro",
            role: "Umuyobozi wa Kiba (1926–2016)",
            quotes: [
                "Condemn me; it does not matter. History will absolve me."
            ]
        },
        {
            name: "José Rizal",
            role: "Umwanditsi w'ubwigenge bwa Filipine (1861–1896)",
            quotes: [
                "The youth is the hope of the fatherland.",
                "I would give my life to you, dear Fatherland, pure and suffering."
            ]
        },
        {
            name: "Benazir Bhutto",
            role: "Minisitiri w'Intebe wa Pakisitani (1953–2007)",
            quotes: [
                "Democracy is the best revenge.",
                "I am a Muslim woman, and I demand my rights."
            ]
        },
        {
            name: "Lee Kuan Yew",
            role: "Minisitiri w'Intebe wa Singapore (1959–1990)",
            quotes: [
                "I have always tried to do what is right rather than what is popular.",
                "We are not sissies; we can take the rough and tumble."
            ]
        },
        {
            name: "Kofi Annan",
            role: "Umwimburizi wa ONU (1997–2006)",
            quotes: [
                "To speak hope is to speak truth.",
                "Development is the best form of conflict prevention.",
                "There is no other way forward for Africa than through education."
            ]
        }
    ],

    /* 🔥 Abakunzwe — scientists and artists the world loves */
    'worldwide-popular': [
        {
            name: "Leonardo da Vinci",
            role: "Umuhanzi n'umuhanga w'Itariya (1452–1519)",
            quotes: [
                "Learning never exhausts the mind.",
                "Simplicity is the ultimate sophistication.",
                "The noblest pleasure is the joy of understanding.",
                "As a well-spent day brings happy sleep, so life well used brings happy death."
            ]
        },
        {
            name: "Marie Curie",
            role: "Umuhanga wa siyansi (1867–1934)",
            quotes: [
                "Nothing in life is to be feared; it is only to be understood.",
                "I am among those who think that science has great beauty.",
                "Life is not easy for any of us. But what of that? We must have perseverance and above all confidence in ourselves."
            ]
        },
        {
            name: "Carl Sagan",
            role: "Umuhanga w'inyenyeri (1934–1996)",
            quotes: [
                "The Cosmos is all that is or was or ever will be.",
                "We are a way for the cosmos to know itself.",
                "Science is a way of thinking much more than it is a body of knowledge."
            ]
        },
        {
            name: "Stephen Hawking",
            role: "Umuhanga w'ikirere (1942–2018)",
            quotes: [
                "However difficult life may seem, there is always something you can do and succeed at.",
                "Remember to look up at the stars and not down at your feet.",
                "Intelligence is the ability to adapt to change."
            ]
        },
        {
            name: "Neil Armstrong",
            role: "Umwanya wa mbere ku kwezi (1930–2012)",
            quotes: [
                "That's one small step for man, one giant leap for mankind."
            ]
        },
        {
            name: "Frida Kahlo",
            role: "Umuhanzi wa Meksika (1907–1954)",
            quotes: [
                "Feet, what do I need you for when I have wings to fly?",
                "I paint flowers so they will not die."
            ]
        },
        {
            name: "Vincent van Gogh",
            role: "Umuhanzi w'Abaholandisi (1853–1890)",
            quotes: [
                "I feel a terrible need of — shall I say the word — religion. Then I go out at night to paint the stars.",
                "Great things are done by a series of small things brought together.",
                "I put my heart and my soul into my work, and have lost my mind in the process."
            ]
        },
        {
            name: "Maya Angelou",
            role: "Umwanditsi wa Amerika (1928–2014)",
            quotes: [
                "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.",
                "There is no greater agony than bearing an untold story inside you.",
                "You may not control all the events that happen to you, but you can decide not to be reduced by them."
            ]
        },
        {
            name: "Kahlil Gibran",
            role: "Umwanditsi wa Libani (1883–1931)",
            quotes: [
                "Work is love made visible.",
                "The deeper that sorrow carves into your being, the more joy you can contain.",
                "Your children are not your children; they are the sons and daughters of Life's longing for itself."
            ]
        },
        {
            name: "Rabindranath Tagore",
            role: "Umwanditsi w'Ubuhindi, Nobel 1913",
            quotes: [
                "Where the mind is without fear and the head is held high, where knowledge is free.",
                "Clouds come floating into my life, no longer to carry rain or usher storm, but to add color to my sunset sky.",
                "You cannot cross the sea merely by standing and staring at the water."
            ]
        },
        {
            name: "Isaac Newton",
            role: "Umuhanga w'Ubwongereza (1643–1727)",
            quotes: [
                "If I have seen further, it is by standing on the shoulders of giants.",
                "To myself I seem to have been only like a boy playing on the seashore, while the great ocean of truth lay all undiscovered before me."
            ]
        },
        {
            name: "Ludwig van Beethoven",
            role: "Umuhanga w'umuziki (1770–1827)",
            quotes: [
                "For me the only true nobility is that which proceeds from the knowledge within us.",
                "To play a wrong note is insignificant; to play without passion is inexcusable.",
                "Music is the mediator between the spiritual and the sensual life."
            ]
        }
    ],

    /* ❄️ Abatarakundwa — thinkers whose ideas are hard to swallow */
    'worldwide-unpopular': [
        {
            name: "Niccolò Machiavelli",
            role: "Umunyapolitiki w'Itariya (1469–1527)",
            quotes: [
                "He who wishes to be obeyed must know how to command.",
                "Everyone sees what you appear to be; few experience what you really are.",
                "It is better to be feared than loved, if you cannot be both."
            ]
        },
        {
            name: "Friedrich Nietzsche",
            role: "Umunyabwenge w'Ubudage (1844–1900)",
            quotes: [
                "He who has a why to live can bear almost any how.",
                "That which does not kill me makes me stronger.",
                "He who fights with monsters should see to it that he does not himself become a monster."
            ]
        },
        {
            name: "Karl Marx",
            role: "Umunyabwenge w'ubukungu (1818–1883)",
            quotes: [
                "The philosophers have only interpreted the world in various ways; the point is to change it.",
                "Workers of the world, unite!",
                "History repeats itself, first as tragedy, second as farce."
            ]
        },
        {
            name: "Ayn Rand",
            role: "Umwanditsi w'ubwigenge bw'umuntu (1905–1982)",
            quotes: [
                "The question isn't who is going to let me; it's who is going to stop me.",
                "You must never place your happiness second to any person or thing."
            ]
        },
        {
            name: "Sun Tzu",
            role: "Umunyabutaba w'Ubushinwa (XVI BC)",
            quotes: [
                "The supreme art of war is to subdue the enemy without fighting.",
                "Know yourself and know your enemy, and in a hundred battles you will never be in peril.",
                "Every battle is won before it is ever fought."
            ]
        },
        {
            name: "Thomas Hobbes",
            role: "Umunyabwenge w'Ubwongereza (1588–1679)",
            quotes: [
                "The life of man is solitary, poor, nasty, brutish and short.",
                "Covenants, without the sword, are but words."
            ]
        },
        {
            name: "Arthur Schopenhauer",
            role: "Umunyabwenge w'ububabare (1788–1860)",
            quotes: [
                "A man can be himself only so long as he is alone.",
                "Compassion is the basis of morality.",
                "We see the world not as it is, but as we are."
            ]
        },
        {
            name: "Emil Cioran",
            role: "Umwanditsi w'ubunyereri (1911–1995)",
            quotes: [
                "It is not worth the trouble to be born.",
                "Without hope one cannot live; without illusions one cannot act."
            ]
        },
        {
            name: "Jean-Paul Sartre",
            role: "Umunyabwenge w'ubwigenge (1905–1980)",
            quotes: [
                "Hell is other people.",
                "Man is condemned to be free; because once thrown into the world, he is responsible for everything he does.",
                "We are our choices."
            ]
        },
        {
            name: "Diogenes of Sinope",
            role: "Umunyabwenge w'Ubugereki (412–323 BC)",
            quotes: [
                "I am a citizen of the world.",
                "I am looking for a human being — said with a lantern in broad daylight."
            ]
        },
        {
            name: "Albert Camus",
            role: "Umwanditsi w'ubusa (1913–1960)",
            quotes: [
                "In the midst of winter, I found there was in me an invincible summer.",
                "One must imagine Sisyphus happy.",
                "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion."
            ]
        },
        {
            name: "Michel Foucault",
            role: "Umunyabwenge w'ubutegetsi (1926–1984)",
            quotes: [
                "Power is everywhere, not because it is everywhere present but because it comes from everywhere.",
                "We are never wrong to write; the day it is possible to burn books would be the day it is no longer possible to write history."
            ]
        }
    ],

    /* 📈 Abari ku isonga — the voices of this decade */
    'worldwide-trending': [
        {
            name: "Greta Thunberg",
            role: "Uwurwanya ihindagurika ry'ikirere (2003–)",
            quotes: [
                "You are never too small to make a difference.",
                "I want you to panic, as if the house was on fire.",
                "Our house is on fire."
            ]
        },
        {
            name: "Malala Yousafzai",
            role: "Uwurwanya uburezi bw'abakobwa (1997–)",
            quotes: [
                "One child, one teacher, one book and one pen can change the world.",
                "Weakness, fear and hopelessness died; strength, power and courage were born."
            ]
        },
        {
            name: "Yuval Noah Harari",
            role: "Umuhanga w'amateka (1976–)",
            quotes: [
                "Change is the only constant.",
                "We are the generation that can end violence, poverty and disease."
            ]
        },
        {
            name: "Barack Obama",
            role: "Perezida wa Amerika (2009–2017)",
            quotes: [
                "Change will not come if we wait for some other person or some other time. We are the ones we've been waiting for.",
                "The future rewards those who press on.",
                "You can't be afraid to fail. It's the only way you're going to succeed."
            ]
        },
        {
            name: "Pope Francis",
            role: "Umutagatifu wa Kiliziya (2013–)",
            quotes: [
                "Who am I to judge?",
                "A little bit of mercy makes the world feel less cold and more just."
            ]
        },
        {
            name: "David Attenborough",
            role: "Umwanditsi w'ibidukikije (1926–)",
            quotes: [
                "No one will protect what they don't care about, and no one will care about what they have never experienced.",
                "Surely we have a responsibility to leave for future generations a planet that is healthy."
            ]
        },
        {
            name: "Ai Weiwei",
            role: "Umuhanzi w'ubwigenge (1957–)",
            quotes: [
                "The real function of art is to open people's eyes, not to please them.",
                "Doubt is my right and my responsibility."
            ]
        },
        {
            name: "Muhammad Yunus",
            role: "Umushinzi w'ubukungu bw'abantu (1940–)",
            quotes: [
                "A world without poverty is possible.",
                "Business should be about people, not only about profit."
            ]
        },
        {
            name: "Vanessa Nakate",
            role: "Uwurwanya ihindagurika ry'ikirere muri Uganda (1996–)",
            quotes: [
                "When we speak about the climate, we must first speak about the people who are already suffering.",
                "Africa is not a victim of the climate story; Africa is a voice in it."
            ]
        },
        {
            name: "Arundhati Roy",
            role: "Umwanditsi n'umurwanyi (1961–)",
            quotes: [
                "Another world is not only possible, she is on her way."
            ]
        },
        {
            name: "Jacinda Ardern",
            role: "Minisitiri w'Intebe wa Nuvelandi (2017–2023)",
            quotes: [
                "They are us.",
                "Empathy is a strength, not a weakness."
            ]
        },
        {
            name: "Christiana Figueres",
            role: "Umuyobozi w'umuryango w'ikirere (1956–)",
            quotes: [
                "We are the first generation to feel the sting of climate change, and we are the last generation that can do something about it."
            ]
        }
    ]
};
