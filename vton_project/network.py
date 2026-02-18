import torch
import torch.nn as nn
import torch.nn.functional as F

class UnetBlock(nn.Module):
    def __init__(self, in_channels, out_channels, down=True):
        super(UnetBlock, self).__init__()
        if down:
            self.conv = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, 4, 2, 1, bias=False),
                nn.BatchNorm2d(out_channels),
                nn.LeakyReLU(0.2, inplace=True)
            )
        else:
            self.conv = nn.Sequential(
                nn.ConvTranspose2d(in_channels, out_channels, 4, 2, 1, bias=False),
                nn.BatchNorm2d(out_channels),
                nn.ReLU(inplace=True)
            )

    def forward(self, x):
        return self.conv(x)

class WarpingModule(nn.Module):
    """
    Simplified Geometric Matching / Warping Module.
    In a real CP-VTON+, this would involve feature matching for TPS.
    Here we implement a simple flow estimation network.
    """
    def __init__(self, in_channels=6): # Person representation + Cloth
        super(WarpingModule, self).__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, 64, 3, 1, 1),
            nn.ReLU(True),
            nn.Conv2d(64, 128, 3, 2, 1),
            nn.ReLU(True),
            nn.Conv2d(128, 256, 3, 2, 1),
            nn.ReLU(True),
        )
        self.flow_head = nn.Conv2d(256, 2, 3, 1, 1) # Output (H/4, W/4, 2)

    def forward(self, person, cloth):
        x = torch.cat([person, cloth], dim=1)
        x = self.conv(x)
        flow = self.flow_head(x)
        # Upsample flow to original resolution
        flow = F.interpolate(flow, size=cloth.shape[2:], mode='bilinear', align_corners=True)
        
        # Apply flow (warping)
        grid = self.make_grid(cloth.shape[0], cloth.shape[2], cloth.shape[3], cloth.device)
        warped_cloth = F.grid_sample(cloth, (grid + flow).permute(0, 2, 3, 1), align_corners=True)
        return warped_cloth

    @staticmethod
    def make_grid(batch_size, height, width, device):
        y, x = torch.meshgrid(torch.linspace(-1, 1, height), torch.linspace(-1, 1, width), indexing='ij')
        grid = torch.stack([x, y], dim=0).to(device)
        return grid.unsqueeze(0).repeat(batch_size, 1, 1, 1)

class UNetGenerator(nn.Module):
    """
    Try-On Module (TOM) Generator.
    Takes concatenated [Person, Warped Cloth] and generates the final image.
    """
    def __init__(self, in_channels=6, out_channels=3):
        super(UNetGenerator, self).__init__()
        
        # Encoder
        self.down1 = nn.Conv2d(in_channels, 64, 4, 2, 1) # 128x96
        self.down2 = UnetBlock(64, 128)  # 64x48
        self.down3 = UnetBlock(128, 256) # 32x24
        self.down4 = UnetBlock(256, 512) # 16x12
        self.down5 = UnetBlock(512, 512) # 8x6
        
        # Decoder
        self.up1 = UnetBlock(512, 512, down=False)
        self.up2 = UnetBlock(1024, 256, down=False)
        self.up3 = UnetBlock(512, 128, down=False)
        self.up4 = UnetBlock(256, 64, down=False)
        
        self.final = nn.Sequential(
            nn.ConvTranspose2d(128, out_channels, 4, 2, 1),
            nn.Tanh()
        )

    def forward(self, person, warped_cloth):
        x = torch.cat([person, warped_cloth], dim=1)
        
        d1 = F.leaky_relu(self.down1(x), 0.2)
        d2 = self.down2(d1)
        d3 = self.down3(d2)
        d4 = self.down4(d3)
        d5 = self.down5(d4)
        
        u1 = self.up1(d5)
        u2 = self.up2(torch.cat([u1, d4], dim=1))
        u3 = self.up3(torch.cat([u2, d3], dim=1))
        u4 = self.up4(torch.cat([u3, d2], dim=1))
        
        out = self.final(torch.cat([u4, d1], dim=1))
        return out

class VTONNetwork(nn.Module):
    def __init__(self):
        super(VTONNetwork, self).__init__()
        self.warping_module = WarpingModule()
        self.generator = UNetGenerator()

    def forward(self, person, cloth):
        warped_cloth = self.warping_module(person, cloth)
        output = self.generator(person, warped_cloth)
        return output, warped_cloth
