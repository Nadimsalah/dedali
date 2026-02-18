import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from dataset import CPDataset, get_transforms
from network import VTONNetwork
import os
from tqdm import tqdm
import torch.nn.functional as F

# Optional: Perceptual Loss (using VGG19 features)
class PerceptualLoss(nn.Module):
    def __init__(self):
        super(PerceptualLoss, self).__init__()
        from torchvision.models import vgg19, VGG19_Weights
        vgg = vgg19(weights=VGG19_Weights.DEFAULT).features
        self.slice1 = nn.Sequential(*[vgg[x] for x in range(0, 4)])   # relu1_2
        self.slice2 = nn.Sequential(*[vgg[x] for x in range(4, 9)])   # relu2_2
        self.slice3 = nn.Sequential(*[vgg[x] for x in range(9, 18)])  # relu3_4
        self.slice4 = nn.Sequential(*[vgg[x] for x in range(18, 27)]) # relu4_4
        for param in self.parameters():
            param.requires_grad = False

    def forward(self, base, target):
        h_relu1 = self.slice1(base)
        h_relu2 = self.slice2(base)
        h_relu3 = self.slice3(base)
        h_relu4 = self.slice4(base)
        
        t_relu1 = self.slice1(target)
        t_relu2 = self.slice2(target)
        t_relu3 = self.slice3(target)
        t_relu4 = self.slice4(target)
        
        loss = F.l1_loss(h_relu1, t_relu1) + \
               F.l1_loss(h_relu2, t_relu2) + \
               F.l1_loss(h_relu3, t_relu3) + \
               F.l1_loss(h_relu4, t_relu4)
        return loss

def train():
    # Parameters
    data_root = "Virtual tryon data" # Adjust if necessary
    batch_size = 4
    lr = 0.0002
    epochs = 100
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Dataset & DataLoader
    dataset = CPDataset(root=data_root, mode='train', transform=get_transforms())
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=2)

    # Model, Optimizer, Loss
    model = VTONNetwork().to(device)
    optimizer = optim.Adam(model.parameters(), lr=lr, betas=(0.5, 0.999))
    criterion_l1 = nn.L1Loss()
    criterion_perceptual = PerceptualLoss().to(device)

    # Training Loop
    os.makedirs("checkpoints", exist_ok=True)
    
    for epoch in range(epochs):
        model.train()
        epoch_loss = 0
        pbar = tqdm(dataloader, desc=f"Epoch {epoch+1}/{epochs}")
        
        for i, batch in enumerate(pbar):
            person = batch['image'].to(device)
            cloth = batch['cloth'].to(device)
            
            optimizer.zero_grad()
            
            # Forward pass
            # Note: In a real VTON training, the target is the 'person' image (if we want reconstruction)
            # or a ground truth refined version. For simplicity, we assume self-supervised reconstruction.
            output, warped_cloth = model(person, cloth)
            
            # Losses
            loss_l1 = criterion_l1(output, person)
            loss_p = criterion_perceptual(output, person)
            
            # Additional loss for warping (optional)
            # Typically you'd have a mask here or a pre-trained warping module.
            
            total_loss = loss_l1 + 0.1 * loss_p
            
            total_loss.backward()
            optimizer.step()
            
            epoch_loss += total_loss.item()
            pbar.set_postfix({"loss": total_loss.item()})
            
        avg_loss = epoch_loss / len(dataloader)
        print(f"Epoch {epoch+1} Average Loss: {avg_loss:.4f}")
        
        # Save checkpoint
        if (epoch + 1) % 10 == 0:
            torch.save(model.state_dict(), f"checkpoints/vton_epoch_{epoch+1}.pth")

if __name__ == "__main__":
    train()
