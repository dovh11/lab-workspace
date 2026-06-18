import asyncio
import httpx
import random
from datetime import datetime, timedelta

API_BASE = "https://lab-workspace-backend.onrender.com/api/v1"

async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Register or Login as Data Generator
        user_data = {
            "username": "data_generator",
            "email": "data_generator@example.com",
            "password": "password123",
            "full_name": "Data Generator",
            "system_role": "Manager"
        }
        
        print("Registering/Logging in data_generator...")
        reg_resp = await client.post(f"{API_BASE}/auth/register", json=user_data)
        if reg_resp.status_code in (200, 201):
            token = reg_resp.json()["access_token"]
        elif reg_resp.status_code == 400 and "Username already registered" in reg_resp.text:
            login_resp = await client.post(
                f"{API_BASE}/auth/login",
                data={"username": "data_generator", "password": "password123"}
            )
            login_resp.raise_for_status()
            token = login_resp.json()["access_token"]
        else:
            print("Failed to register or login:", reg_resp.text)
            return

        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Get all existing users
        print("Fetching all users...")
        users_resp = await client.get(f"{API_BASE}/users/", headers=headers)
        users_resp.raise_for_status()
        all_users = users_resp.json()
        print(f"Found {len(all_users)} users.")
        
        user_ids = [u["user_id"] for u in all_users if u["username"] != "data_generator"]
        if not user_ids:
            print("No other users found. Please make sure the 6 accounts are created.")
            return

        # 3. Create 10 Projects
        project_titles = [
            "AlphaFold Integration Analysis", "Quantum Machine Learning Models", 
            "Neuro-Symbolic AI Framework", "LLM Fine-tuning on Medical Data", 
            "Reinforcement Learning for Robotics", "Computer Vision for Defect Detection", 
            "Time-Series Forecasting for Climate", "Generative Adversarial Networks for Art", 
            "Federated Learning in Mobile Edge", "Natural Language Understanding Benchmarks"
        ]
        
        roles = ["Lead", "Contributor", "Reviewer"]
        
        print("Creating 10 projects...")
        for i, title in enumerate(project_titles):
            proj_data = {
                "title": title,
                "description": f"This is an automated generated project about {title}.",
                "status": "Active" if i % 4 != 0 else "Archived"
            }
            proj_resp = await client.post(f"{API_BASE}/projects/", json=proj_data, headers=headers)
            proj_resp.raise_for_status()
            project_id = proj_resp.json()["project_id"]
            
            # Add random members to project
            members_to_add = random.sample(user_ids, k=min(3, len(user_ids)))
            for member_id in members_to_add:
                member_data = {
                    "user_id": member_id,
                    "role_in_project": random.choice(roles)
                }
                await client.post(f"{API_BASE}/projects/{project_id}/members", json=member_data, headers=headers)
                
            # Create 1-3 experiments for this project
            frameworks = ["PyTorch", "TensorFlow", "JAX"]
            for j in range(random.randint(1, 3)):
                exp_data = {
                    "project_id": project_id,
                    "experiment_name": f"Exp {j+1}: Baseline {title.split()[0]}",
                    "description": "Baseline run with default parameters",
                    "framework": random.choice(frameworks),
                    "hyperparameters": {"learning_rate": random.choice([0.01, 0.001, 0.0001]), "batch_size": random.choice([16, 32, 64])}
                }
                exp_resp = await client.post(f"{API_BASE}/experiments/", json=exp_data, headers=headers)
                exp_resp.raise_for_status()
                exp_id = exp_resp.json()["experiment_id"]
                
                # Append metrics (epochs 1 to 5)
                loss = random.uniform(1.0, 2.0)
                val_loss = loss + random.uniform(0.1, 0.3)
                accuracy = random.uniform(0.5, 0.7)
                for epoch in range(1, 6):
                    loss = loss * random.uniform(0.8, 0.95)
                    val_loss = val_loss * random.uniform(0.8, 0.95)
                    accuracy = min(1.0, accuracy + random.uniform(0.02, 0.08))
                    metric_data = {
                        "entry": {
                            "epoch": epoch,
                            "loss": round(loss, 4),
                            "val_loss": round(val_loss, 4),
                            "accuracy": round(accuracy, 4)
                        }
                    }
                    await client.post(f"{API_BASE}/experiments/{exp_id}/metrics", json=metric_data, headers=headers)
            
            print(f"  - Created project {project_id} with experiments.")

        # 4. Create 5 Journal Club sessions
        paper_topics = [
            "Attention Is All You Need", "Deep Residual Learning for Image Recognition", 
            "Language Models are Few-Shot Learners", "Generative Adversarial Nets", 
            "YOLO: Unified, Real-Time Object Detection"
        ]
        
        print("Creating 5 journal club sessions...")
        now = datetime.utcnow()
        for i, paper in enumerate(paper_topics):
            jc_data = {
                "title": f"Discussion: {paper}",
                "topic": "Deep Learning Architecture",
                "meeting_time": (now + timedelta(days=(i * 2) - 2)).isoformat() + "Z",
                "location_or_link": "https://zoom.us/j/123456789",
                "paper_reference": paper,
            }
            jc_resp = await client.post(f"{API_BASE}/journal-clubs/", json=jc_data, headers=headers)
            jc_resp.raise_for_status()
            club_id = jc_resp.json()["club_id"]
            
            # RSVP some users
            rsvp_users = random.sample(user_ids, k=min(4, len(user_ids)))
            for user_id in rsvp_users:
                # Login as the user to RSVP
                # We can't RSVP for other users through the API easily because RSVP requires current_user.
                # Let's see if we can just skip RSVP or RSVP for data_generator only.
                pass
            
            # RSVP for data_generator
            rsvp_data = {"rsvp_status": random.choice(["Attending", "Maybe"])}
            await client.post(f"{API_BASE}/journal-clubs/{club_id}/rsvp", json=rsvp_data, headers=headers)
            
            print(f"  - Created Journal Club {club_id}")

        print("Data generation complete!")

if __name__ == "__main__":
    asyncio.run(main())
