import {
    TaskQueries
} from "@/lib/db/queries"
import {
    type NextRequest,
    NextResponse
} from "next/server"
import {
    sendEmail
} from "@/components/utils/send_email"
import { verifyRequest } from "@/lib/auth/api"
import { getAllUsers } from "@/lib/db/queries/user"

export async function GET(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error
    if (verification.userId !== "cron" && verification.userId !== "00000000") {
        return NextResponse.json({
            error: "Unauthorized"
        }, {
            status: 401
        })
    }
    const users = await getAllUsers()

    for (const user of users) {
        if (verification.userId === "00000000" && user.id !== "00000000") {
            continue
        }
        try {
            const tasksToDo = await TaskQueries.Task.getUncompletedAndDueInTheNextThreeDaysOrLessTasks(user.id);
            const tasksDone = await TaskQueries.Task.getTasksCompletedTheDayBefore(user.id);

            // Sort tasksToDo by due date in ascending order
            const sortedTasksToDo = tasksToDo.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());

            // Helper function to calculate relative days
            const getRelativeDay = (dueDate: Date): string => {
                const today = new Date();
                const diffInDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
                return rtf.format(diffInDays, "day");
            };

            // Group tasksDone by projects
            const groupedTasksDone = tasksDone.reduce((acc: Record<string, typeof tasksDone>, task) => {
                const project = task.project_title || "No Project";
                if (!acc[project]) {
                    acc[project] = [];
                }
                acc[project].push(task);
                return acc;
            }, {});

            // Group tasksToDo by relative days
            const groupedByDays = sortedTasksToDo.reduce((acc: Record<string, typeof sortedTasksToDo>, task) => {
                const relativeDay = getRelativeDay(new Date(task.due));
                if (!acc[relativeDay]) {
                    acc[relativeDay] = [];
                }
                acc[relativeDay].push(task);
                return acc;
            }, {});

            // Group tasksToDo by projects within each relative day
            const groupedByProjects = Object.entries(groupedByDays).reduce((acc: Record<string, Record<string, typeof sortedTasksToDo>>, [day, tasksToDo]) => {
                acc[day] = tasksToDo.reduce((projectAcc: Record<string, typeof sortedTasksToDo>, task) => {
                    const project = task.project_title || "No Project";
                    if (!projectAcc[project]) {
                        projectAcc[project] = [];
                    }
                    projectAcc[project].push(task);
                    return projectAcc;
                }, {});
                return acc;
            }, {});

            // Generate email content
            let emailContent = `
            <html>
            <head>
            <style>
            body {
                background-color: #f3f4f6;
                margin: 0;
                font-family: Arial, sans-serif;
            }
            main {
                max-width: 768px;
                width: 100%;
                margin: 20px auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            h1 {
                font-size: 1.5rem;
                font-weight: bold;
                color: #000000;
                margin-bottom: 16px;
                text-align: center;
            }
            h2 {
                font-size: 1.25rem;
                font-weight: 600;
                color: #374151;
                margin-top: 16px;
            }
            h3 {
                font-size: 1.125rem;
                font-weight: 500;
                color: #4b5563;
                margin-top: 8px;
            }
            ul {
                list-style-type: disc;
                padding-left: 20px;
                margin: 0;
            }
            li {
                color: #1f2937;
                margin-bottom: 8px;
            }
            @media (max-width: 600px) {
                main {
                    padding: 10px;
                }
                h1 {
                    font-size: 1.5rem;
                }
                h2 {
                    font-size: 1.2rem;
                }
                h3 {
                    font-size: 0.875rem;
                }
                ul {
                    padding-left: 15px;
                }
                li {
                        font-size: 0.875rem;
                    }
                }
            </style>
            </head>
            <body>
            <main>
            <h1>Your Daily Task List</h1>
            `;

            if (tasksToDo.length <= 0 && tasksDone.length <= 0) {
                continue
            }

            // Add tasksDone to the email content
            if (tasksDone.length > 0) {
                emailContent += `<h2>Tasks Completed Yesterday</h2>`;
                emailContent += `<p>You completed ${tasksDone.length} task${tasksDone.length > 1 ? "s" : ""} yesterday!</p>`;

                for (const [project, tasks] of Object.entries(groupedTasksDone)) {
                    emailContent += `<h3>${project}</h3><ul>`;
                    tasks.forEach((task) => {
                        emailContent += `<li>${task.title}</li>`;
                    });
                    emailContent += `</ul>`;
                }
            } else {
                emailContent += `<h2>No Tasks Completed Yesterday</h2>`;
            }

            // Add tasksToDo to the email content
            for (const [day, projects] of Object.entries(groupedByProjects)) {
                emailContent += `<h2>Due ${day}</h2>`;
                for (const [project, tasksToDo] of Object.entries(projects as Record<string, typeof sortedTasksToDo>)) {
                    emailContent += `<h3>${project}</h3><ul>`;
                    tasksToDo.forEach((task) => {
                        emailContent += `<li>${task.title}</li>`;
                    });
                    emailContent += `</ul>`;
                }
            }

            emailContent += `
            </main>
            </body>
            </html>
            `;

            const today = new Date();
            let formattedSubject: string

            if (tasksDone.length > 0) {
                formattedSubject = `You did a great job completing ${tasksDone.length} task${tasksDone.length > 1 ? "s" : ""} yesterday! Here's your task list for ${today.toLocaleDateString("en-GB", { weekday: 'long', day: '2-digit', month: 'long' })} !`;
            } else {
                formattedSubject = `Here's your task list for ${today.toLocaleDateString("en-GB", { weekday: 'long', day: '2-digit', month: 'long' })} !`;
            }
            const result = await sendEmail(user.email, formattedSubject, emailContent);

            if (!result) {
                return NextResponse.json({
                    error: "Failed to send email"
                }, {
                    status: 500
                });
            }
        } catch (error) {
            console.error("Error fetching tasksToDo:", error);
            return NextResponse.json({
                error: "Failed to fetch tasksToDo"
            }, {
                status: 500
            });
        }
        // Wait for 1 second before sending the next email
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return NextResponse.json({
        message: "Email sent successfully"
    }, {
        status: 200
    });

}