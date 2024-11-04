const Alexa = require('ask-sdk-core');
const keys = require('./keys.js');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: keys.OPEN_AI_KEY
});

const welcomeMessages = [
    "Hola, estoy lista para responder tus preguntas usando la inteligencia de Chat GPT. ¿Qué te gustaría saber hoy?",
    "Hola, soy tu asistente con la potencia de Chat GPT. Prepárate para respuestas detalladas y útiles. ¿Qué te gustaría preguntar?",
    "¡Hola! Conéctate al conocimiento de Chat GPT a través de mí. Hazme tus preguntas y aprende algo nuevo hoy mismo.",
    "Hola, estoy aquí con Chat GPT para explorar cualquier tema que te interese. ¿Cuál es tu primera pregunta?",
    "Bienvenido a una experiencia de información avanzada. Soy Alexa con la inteligencia de Chat GPT. Pregunta lo que necesites y obtendrás respuestas precisas.",
    "Hola, soy Alexa, ahora con Chat GPT integrado. ¡Pregunta y descubre!",
    "¡Hola! Hoy vengo en modo superinteligente, gracias a Chat GPT. Prepárate para respuestas asombrosas. ¿Con qué quieres empezar?",
    "Hola, he mejorado mis capacidades gracias a Chat GPT. Estoy lista para responder tus dudas de forma precisa y concisa. ¿Qué quieres saber?",
    "Hola, estoy aquí para ayudarte a descubrir respuestas con la potencia de Chat GPT. Hazme una pregunta y veamos qué podemos aprender juntos."
];

const repromptPhrases = [
    '¿Hay algo más sobre lo que quieras aprender?',
    '¿Te gustaría saber algo más?',
    '¿Puedo ayudarte con otra pregunta?',
    'Recuerda, puedo responder a tus dudas, ¿quieres saber algo más?',
    'Estoy disponible para más preguntas, ¿qué otra cosa quieres saber?'
];

const getRandomReprompt = () => {
    return repromptPhrases[Math.floor(Math.random() * repromptPhrases.length)];
};

let lastWelcomeMessage = '';

const getRandomWelcome = () => {
    let newMessage;
    do {
        newMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    } while (newMessage === lastWelcomeMessage);
    
    lastWelcomeMessage = newMessage;
    return newMessage;
};

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = getRandomWelcome();

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(getRandomReprompt())
            .getResponse();
    }
};

const AskChatGPTIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AskChatGPTintent';
    },
    async handle(handlerInput) {
        const phrase = Alexa.getSlotValue(handlerInput.requestEnvelope, 'phrase') || '';
        const question = Alexa.getSlotValue(handlerInput.requestEnvelope, 'question');
        const fullQuery = `${phrase} ${question}`.trim();
        let speakOutput = 'Lo siento, no pude obtener una respuesta en este momento. Por favor, inténtalo de nuevo más tarde.';

        try {
            console.log(`Frase recibida: ${phrase}`);
            console.log(`Pregunta recibida: ${question}`);
            console.log('Usando la clave API:', keys.OPEN_AI_KEY.slice(0, 6) + '...');

            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: `Responde brevemente en español: ${fullQuery}` }],
                max_tokens: 50,
                temperature: 0.2,
                top_p: 1,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
            });

            console.log('Respuesta de OpenAI:', response);

            if (response.choices && response.choices.length > 0) {
                speakOutput = response.choices[0].message.content.trim() + ' ¿Qué más te gustaría saber?';
            } else {
                console.error('La respuesta de OpenAI no tiene contenido.');
            }
        } catch (error) {
            console.error(`Error en la solicitud a OpenAI: ${error.message}`);
            console.error(`Detalles del error: ${error.stack}`);

            if (error.message.includes('429')) {
                speakOutput = 'Lo siento, parece que hemos superado el límite de uso de la API. Por favor, verifica los detalles de tu plan y vuelve a intentarlo más tarde.';
            } else if (error.message.includes('401')) {
                speakOutput = 'Lo siento, hubo un problema de autenticación con la API. Verifica tu clave de API y vuelve a intentarlo.';
            } else {
                speakOutput = 'Lo siento, hubo un problema al obtener la respuesta. Por favor, inténtalo de nuevo más tarde.';
            }
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(getRandomReprompt())
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Puedes preguntarme lo que gustes, tengo integrado Chat GPT, entonces, ¿cómo te puedo ayudar?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const farewellMessages = [
            'Vámonos que aquí espantan....!',
            'Hasta luego, ¡cuídate!',
            'Adiós, espero verte pronto por aquí.',
            'Nos vemos, ¡que tengas un gran día!',
            'Me despido, pero siempre estaré aquí para cuando me necesites.'
        ];
        const speakOutput = farewellMessages[Math.floor(Math.random() * farewellMessages.length)];

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Lo siento, no sé nada de eso. Inténtalo de nuevo.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(getRandomReprompt())
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `Has activado ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Lo siento, tuve problemas para hacer lo que pediste. Inténtalo de nuevo.';
        console.error(`~~~~ Error handled: ${error.message}`);
        console.error(`Detalles del error: ${error.stack}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(getRandomReprompt())
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        AskChatGPTIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler
    )
    .addErrorHandlers(ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();
    
    
    /**
 * # Alexa Integration with ChatGPT Project
This project has been developed as an open foundation for other developers to create, customize, and enhance their own Alexa applications integrated with ChatGPT technology.
**License and Usage**: This code is provided under the Apache License 2.0, allowing any developer to use, modify, and redistribute it to foster collaborative development and innovation in creating advanced Alexa skills.
**Contributions and Improvements**: The developer community is encouraged to contribute to the project, propose enhancements, and report issues. Developers can submit pull requests, open issues, and participate in discussions to continue enriching the functionality of this integration.
This project is designed to be easy to understand and extend, facilitating the implementation of new features and adaptation to specific needs. We hope it inspires you to create new experiences with Alexa and ChatGPT!
 * This project uses the Alexa SDK provided by Amazon for developing voice skills. Alexa is a registered trademark of Amazon.com, Inc. or its affiliates. This project is not affiliated with, sponsored by, or endorsed by Amazon.

 */