const util = require('util');
const fs = require('fs');
const TrainingApiClient = require("azure-cognitiveservices-customvision-training");
const PredictionApiClient = require("azure-cognitiveservices-customvision-prediction");

const setTimeoutPromise = util.promisify(setTimeout);

const trainingKey = "<6ddb8f1e45234e2eb982de1d025e8494>";
const predictionKey = "<83ec0e6799194ee99dda4f7894d72cb2>";
const predictionResourceId = "</subscriptions/d0ada3f8-6e08-4320-badc-d59d39a0ef07/resourceGroups/123/providers/Microsoft.CognitiveServices/accounts/123_prediction>";
const sampleDataRoot = "<https://southcentralus.api.cognitive.microsoft.com/customvision/v3.0/Prediction/eb0f6514-a165-4a11-899d-97bd114d5a74/classify/iterations/Iteration1/image>";

const endPoint = "https://southcentralus.api.cognitive.microsoft.com"

const publishIterationName = "classifyModel";

const trainer = new TrainingApiClient(trainingKey, endPoint);

(async () => {
    console.log("Creating project...");
    const sampleProject = await trainer.createProject("Sample Project")
const hemlockTag = await trainer.createTag(sampleProject.id, "Hemlock");
const scissorTag = await trainer.createTag(sampleProject.id, "Scissor");

console.log("Training...");
    let trainingIteration = await trainer.trainProject(sampleProject.id);

    // Wait for training to complete
    console.log("Training started...");
    while (trainingIteration.status == "Training") {
        console.log("Training status: " + trainingIteration.status);
        await setTimeoutPromise(1000, null);
        trainingIteration = await trainer.getIteration(sampleProject.id, trainingIteration.id)
    }
    console.log("Training status: " + trainingIteration.status);
    
    // Publish the iteration to the end point
    await trainer.publishIteration(sampleProject.id, trainingIteration.id, publishIterationName, predictionResourceId);

    const predictor = new PredictionApiClient(predictionKey, endPoint);
    const testFile = fs.readFileSync(`${sampleDataRoot}/Test/test_image.jpg`);

    const results = await predictor.classifyImage(sampleProject.id, publishIterationName, testFile);

    // Step 6. Show results
    console.log("Results:");
    results.predictions.forEach(predictedResult => {
        console.log(`\t ${predictedResult.tagName}: ${(predictedResult.probability * 100.0).toFixed(2)}%`);
    });
})()