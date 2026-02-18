import torch
from torch.utils.data import Dataset
from torchvision import transforms
from PIL import Image
import os
import tqdm

class CPDataset(Dataset):
    """
    Custom Dataset for Virtual Try-On.
    Expected data structure:
    root/
        train/ (images)
        test/ (images)
        train_pairs.txt
        test_pairs.txt
    """
    def __init__(self, root, mode='train', transform=None, data_list=None):
        super(CPDataset, self).__init__()
        self.root = root
        self.mode = mode
        self.transform = transform
        self.data_list = data_list if data_list is not None else f"{mode}_pairs.txt"
        
        # Paths
        self.image_dir = os.path.join(self.root, self.mode)
        # Assuming cloth and person images are in the same folder or structure implied by pairs file
        # Standard VTON datasets usually have subfolders like 'image', 'cloth', 'cloth-mask' etc.
        # But based on the prompt: "train/" (folder with training images), "train_pairs.txt"
        # The prompt implies a simpler structure or we need to infer.
        # "train/ folder contains training images".
        # Let's assume the text file lines are like: "person.jpg cloth.jpg"
        # And both are in "train/". or maybe structured.
        # I will assume the paths in text file are relative to "train/" or just filenames.
        
        self.data_path = os.path.join(self.root, self.data_list)
        self.im_names = []
        self.c_names = []
        
        if os.path.exists(self.data_path):
            with open(self.data_path, 'r') as f:
                for line in f.readlines():
                    im_name, c_name = line.strip().split()
                    self.im_names.append(im_name)
                    self.c_names.append(c_name)
        else:
            # Fallback for debugging if file doesn't exist yet
            print(f"Warning: {self.data_path} not found. Dataset will be empty.")
            
    def __len__(self):
        return len(self.im_names)

    def __getitem__(self, index):
        im_name = self.im_names[index]
        c_name = self.c_names[index]
        
        # Load Person Image
        im_path = os.path.join(self.image_dir, im_name)
        # Load Cloth Image
        # Note: In some datasets cloth is in a separate folder. 
        # The prompt says: "train/ (folder contains training images)".
        # It's possible both person and cloth are in 'train/', or the txt file gives relative paths.
        # I will assume they are in 'train/' for now given the simple description.
        c_path = os.path.join(self.image_dir, c_name)
        
        if not os.path.exists(im_path):
            # Try finding it recursively? No, just error or likely different structure.
            # fallback for now
            pass

        try:
            im = Image.open(im_path).convert('RGB')
            c = Image.open(c_path).convert('RGB')
        except Exception as e:
            # Create dummy images if files are missing (for potential dry run)
            print(f"Error loading {im_path} or {c_path}: {e}")
            im = Image.new('RGB', (256, 192), (255, 255, 255))
            c = Image.new('RGB', (256, 192), (255, 255, 255))

        if self.transform:
            im = self.transform(im)
            c = self.transform(c)
            
        return {
            'image': im,   # Person image (target)
            'cloth': c,    # Cloth image (source)
            'im_name': im_name,
            'c_name': c_name
        }

def get_transforms(width=192, height=256):
    return transforms.Compose([
        transforms.Resize((height, width)),
        transforms.ToTensor(),
        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
    ])
