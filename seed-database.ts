import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { MongoClient } from "mongodb";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { z } from "zod";
import "dotenv/config";

const client = new MongoClient(process.env.MONGODB_ATLAS_URI as string);

const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,       // temperature range is 0 - 1. (O - very strict, 1 - creative) 
});

const EmployeeSchema = z.object({
    employee_id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    date_of_birth: z.string(),
    address: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        postal_code: z.string(),
        country: z.string(),

    }),
    contact_details: z.object({
        email: z.string().email(),
        phone_number: z.string(),
    }),
    job_details: z.object({
        job_title: z.string(),
        department: z.string(),
        hire_date: z.string(),
        employment_type: z.string(),
        salary: z.number(),
        currency: z.string(),
    }),
    work_location: z.object({
        nearest_office: z.string(),
        is_remote: z.boolean(),
    }),
    reporting_manager: z.string().nullable(),
    skills: z.array(z.string()),
    performance_reviews: z.array(
        z.object({
            review_Date: z.string(),
            rating: z.number(),
            comments: z.string(),
        })
    ),
    benefits: z.object({
        health_insurance: z.string(),
        retirement_plan: z.string(),
        paid_time_off: z.number(),
    }),
    emergency_contact: z.object({
        name: z.string(),
        relationship: z.string(),
        phone_number: z.string(),
    }),
    notes: z.string(),
});

type Employee = z.infer<typeof EmployeeSchema>;

const parser = StructuredOutputParser.fromZodSchema(z.array(EmployeeSchema));

async function generateSyntheticData(): Promise<Employee[]> {
    const prompt = `You are a helpful assistant that generates employee data. Generate 10 fictional employee records. Each record should include the following fields: employee_id, first_name, last_name, date_of_birth, address, contact_details, job_details, work_location, reporting_manager, skills, performance_reviews, emergency_contact, notes. Ensure variety in the data and realistic values.
    ${parser.getFormatInstructions()}`;

    console.log("Generating synthetic data...");

    const response = await llm.invoke(prompt);
    return parser.parse(response.content as string);
}