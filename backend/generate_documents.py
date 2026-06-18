import asyncio
import httpx
import os

API_BASE = "https://lab-workspace-backend.onrender.com/api/v1"

async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Login as Data Generator
        print("Logging in data_generator...")
        login_resp = await client.post(
            f"{API_BASE}/auth/login",
            data={"username": "data_generator", "password": "password123"}
        )
        if login_resp.status_code != 200:
            print("Failed to login:", login_resp.text)
            return
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Get all projects
        print("Fetching all projects...")
        projects_resp = await client.get(f"{API_BASE}/projects/", headers=headers, params={"limit": 100})
        projects_resp.raise_for_status()
        projects = projects_resp.json()
        print(f"Found {len(projects)} projects.")
        
        # Create a dummy pdf file
        dummy_file_path = "dummy_research.pdf"
        with open(dummy_file_path, "wb") as f:
            f.write(b"%PDF-1.4\n%Dummy PDF for demo\n")
            
        doc_titles = [
            "Literature Review V1", "Dataset Documentation", 
            "Initial Ethics Proposal", "Architecture Diagram", 
            "Weekly Progress Report", "Final Draft Submission"
        ]
        
        try:
            for proj in projects:
                proj_id = proj["project_id"]
                title = doc_titles[proj_id % len(doc_titles)]
                
                print(f"Creating document for Project {proj_id}: {title}...")
                
                # Create metadata
                doc_data = {
                    "project_id": proj_id,
                    "title": title,
                    "doc_type": "PDF",
                    "description": "Auto-generated document for demo purposes."
                }
                doc_resp = await client.post(f"{API_BASE}/documents/", json=doc_data, headers=headers)
                
                # Check for 403 or other errors, but skip gracefully
                if doc_resp.status_code != 201:
                    print(f"  Skipped (No access to create docs in this project?): {doc_resp.text}")
                    continue
                    
                doc_id = doc_resp.json()["document_id"]
                
                # Upload version
                with open(dummy_file_path, "rb") as f:
                    files = {"file": ("demo_paper.pdf", f, "application/pdf")}
                    data = {"commit_message": "Initial document upload (demo)"}
                    v_resp = await client.post(
                        f"{API_BASE}/documents/{doc_id}/versions", 
                        headers=headers,
                        data=data,
                        files=files
                    )
                    if v_resp.status_code == 201:
                        print(f"  - Uploaded version to doc {doc_id}")
                    else:
                        print(f"  - Failed to upload version: {v_resp.text}")
        finally:
            if os.path.exists(dummy_file_path):
                os.remove(dummy_file_path)
                
        print("Document generation complete!")

if __name__ == "__main__":
    asyncio.run(main())
