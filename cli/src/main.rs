use clap::{Args, Parser, Subcommand};
use std::io::{self, Write};
use colored::*;

#[derive(Parser, Debug)]
#[command(version, about = "What About", long_about = "Lets have some fun")]
pub struct CLI {
    #[clap(subcommand)]
    pub command: CommandType,
}

#[derive(Subcommand, Debug)]
pub enum CommandType {
    /// Interface with tasks
    Task(TaskCommand),
}

#[derive(Debug, Args)]
pub struct TaskCommand
{
    #[clap(subcommand)]
    pub command: TaskSubcommand
}

#[derive(Debug, Subcommand)]
pub enum TaskSubcommand {
    /// Create New Task
    Create(CreateTask)
}

#[derive(Debug, Args)]
pub struct CreateTask {
    /// Name of the task
    #[arg(short, long)]
    pub name: Option<String>,
}

fn main() {
    let cli = CLI::parse();

    match cli.command {
        CommandType::Task(task_cmd) => match task_cmd.command {
            TaskSubcommand::Create(args) => create_task(args),
        },
    }

    fn create_task(args: CreateTask) {
        let name = match args.name {
            Some(n) if !n.trim().is_empty() => n,
            _ => {
                let mut input = String::new();

                println!("{}", "What is your task name?".yellow().bold());
                io::stdout().flush().unwrap();

                io::stdin()
                    .read_line(&mut input)
                    .expect("Failed to read line");

                input.trim().to_string()
            }
        };

        println!("Creating: {}", name);
    }
}
