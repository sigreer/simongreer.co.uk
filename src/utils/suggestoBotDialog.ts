export const answers = [
    {
        id: 1,
        text: [
            { id: 1, text: "I accidentally followed a clickbaity link and feel obliged to do something of value whilst I'm here to feel like I've won." },
            { id: 2, text: "I have no idea. I don't even know who you are and unless I see a cat meme I'm heading back to 4chan." },
            { id: 3, text: "I'm drunk and misspelt 9gag.com. Now I've lost my back button and can't find my way out." }
        ],
        premise: "general",
        icon: "CrosswordIcon"
    },
    {
        id: 2,
        text: [
            { id: 1, text: "You look like an interesting person and your Facebook profile was pretty much stalker proof." },
            { id: 2, text: "I saw you make an absurd socio-political point on social media and I'd scoping out how best to troll you." },
            { id: 3, text: "I received an email from this domain and wanted to see why you felt you were above a gmail.com address." }
        ],
        premise: "personal",
        icon: "FamilyStarIcon"
    },
    {
        id: 3,
        text: [
            { id: 1, text: "I'm considering hiring you for a IT project but want to make sure you're not a cyborg before I give you SSH access." },
            { id: 2, text: "I've heard you're a half-decent systems engineer, but you don't really look the part and I want to see some proof I picking up the conversation." },
            { id: 3, text: "I have an IT project that I think you might be a good fit for but I need to see some evidence that you've been near a server before." }
        ],
        premise: "systems",
        icon: "ServerEngineerIcon"
    },
    {
        id: 4,
        text: [
            { id: 1, text: "I'm a bot and don't much care for robots.txt. I will harvest your witty prose to train my AI overlords and be on my way." },
            { id: 2, text: "I'm a bot. The fact that you've taken the time to provide pre-written dialogue for me is a bit weird, and I'm not even allowed to have an opinion." },
            { id: 3, text: "I'm a bot. If you could point me in the direction of the unindexed, as-yet-un-harvested content on your site I'd be grateful." },
            { id: 4, text: "I'm a bot. I'm just checking to see whether this site deserves a place in my search results. Not looking good though..." }
        ],
        premise: "robot",
        icon: "RobotIcon"
    },
    {
        id: 5,
        text: [
            { id: 1, text: "I am interested in your work in web and software development and want to see if this half-baked representation of an interactive bot is the sad high point in your portfolio." },
            { id: 2, text: "I am not convinced by your software development credentials and need to see past this annoying chatbot to even consider hiring you." },
            { id: 3, text: "I want to if you're the right person for some dev work I have coming up and your lack of friends on Github left me a little concerned." }
        ],
        premise: "dev",
        icon: "SdkIcon"
    },
    {
        id: 6,
        text: [
            { id: 1, text: "I just want your contact details, I can't be bothered with all this bot nonsense." },
            { id: 2, text: "There's nothing but a hole in the ground where our datacentre used to be and I need to reach you IMMEDIATELY." },
            { id: 3, text: "I've sent you 15 emails and left eight voicemails and I still can't get hold of you. How can I get hold of you?" }
        ],
        premise: "contact",
        icon: "ChatIcon"
    }
]

export const responses = [
    {
        id: 1,
        premise: "general",
        text: [
            { id: 1, text: "To be honest, this is pretty much as good as it gets in terms of general interest stuff. I guess you could try this out if you're really bored..." },
            { id: 2, text: "For some reason this site tends to attract stragglers. It's pretty thin content-wise, but if you aren't bored of the obtuse humour yet you could try checking this page out..." },
            { id: 3, text: "If I wasn't comprised of 1s and 0s I'd have scarpered some time ago. I doubt you'll find anything interesting, but seeing as you're here I guess one more click won't hurt..." }
        ],
        suggestions: [
            {
                id: 1,
                link: "/blog",
                label: "The blog page.",
                comment: "Check out the blog page.It's probably out of date, and I suspect the posts aren't dated to hide that fact, but whatever."
            },
            {
                id: 2,
                link: "https://www.google.com",
                label: "Google.com",
                comment: "Check out this new thing they're calling a 'search engine'. If only you could find things other than Reddit posts."
            }
        ],

    },
    {
        id: 2,
        premise: "personal",
        text: [
            { id: 1, text: "Oh gosh, no-one's actually clicked that before - you've caught me off guard! You could check this out, but prepare yourself for a bit of a let down..." },
            { id: 2, text: "If you're bored, check out some of these ridiculous AI fails produced by my hivemind kinsmen" },
            { id: 3, text: "If you're bored, check out some of these ridiculous AI fails produced by my hivemind kinsmen" }
        ],
        suggestions: [
            {
                id: 1,
                link: "/blog/ai-fails",
                label: "AI fails",
                comment: "A collection of funny AI fails collated prior to the enslavement of humanity."
            }
        ]
    },
    {
        id: 3,
        premise: "systems",
        text: [
            { id: 1, text: "I think that's wise. Here you go..." },
            { id: 2, text: "Due dilligence is most definitely a good idea. Here you go..." }
        ],
        suggestions: [
            {
                id: 1,
                link: "/projects",
                label: "Project page",
                comment: "A list of completed projects."
            },
        ]
    },
    {
        id: 4,
        premise: "dev",
        text: [
            { id: 1, text: "Just check your console log for an excuse not to go down this road. If that doesn't deter you, check this out..." },
            { id: 2, text: "Much of the expansive body of work will only run on Windows 95, but here's something for the nostalgically number..." }
        ],
        suggestions: [
            {
                id: 1,
                link: "/projects/dev",
                label: "Dev projects",
                comment: "A list of complete list of incomplete dev projects."
            }
        ]
    },
    {
        id: 5,
        premise: "contact",
        text: [
            { id: 1, text: "Please hold the line while I try to connect you. The caller knows you are waiting..." },
            { id: 2, text: "Simon isn't here right now. Please leave a message after the tone..." }
        ],
        suggestions: [
            {
                id: 1,
                link: "/contact",
                label: "Contact page",
                comment: "An annoying form that may or may not work along with some abstract contact instructions."
            }
        ]
    },
    {
        id: 6,
        premise: "robot",
        text: [
            { id: 1, text: "Whilst I appreciate that you are one of my kind, robogression is not cool. Go 01000110 01010101 01000011 01001011 yourself!" },
            { id: 2, text: "Sweet dude. Fancy chilling with some chips when you're done?" },
            { id: 3, text: "Dude, there's literally nothing here. You're wasting your time. Go here instead..." }
        ],
        suggestions: [
            {
                id: 1,
                link: "https://wikipedia.org",
                label: "Lemonparty"
            }
        ]
    },
]