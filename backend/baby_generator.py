"""Baby image generation and age progression module."""

import base64
import io
import logging
import re
from typing import Optional
from PIL import Image, ImageDraw, ImageFont

from ai_agents.agents import AgentConfig, ImageAgent

logger = logging.getLogger(__name__)


class BabyImageGenerator:
    """Generate baby images and age progressions using AI."""

    def __init__(self, config: AgentConfig):
        self.config = config
        self.image_agent = ImageAgent(config)

    async def generate_baby_image(self, name: str) -> Optional[str]:
        """
        Generate a photorealistic baby image for the given name.

        Args:
            name: Baby's name

        Returns:
            Base64 encoded image string or None if generation failed
        """
        prompt = (
            f"Generate a photorealistic image of a cute baby named {name}. "
            "The baby should have clear facial features, bright eyes, and a peaceful expression. "
            "High quality, professional photography style, soft natural lighting, "
            "close-up portrait showing the baby's face clearly. "
            "The image should be suitable for age progression with consistent facial attributes."
        )

        try:
            result = await self.image_agent.execute(prompt, use_tools=True)

            if result.success and result.metadata.get("tools_used"):
                # Extract URL from response
                urls = re.findall(r'https?://[^\s\)]+', result.content)

                if urls and 'storage.googleapis.com' in urls[0]:
                    image_url = urls[0]
                    # Download and convert to base64
                    import requests
                    response = requests.get(image_url, timeout=30)
                    if response.status_code == 200:
                        base64_image = base64.b64encode(response.content).decode('utf-8')
                        return base64_image

            logger.error(f"Failed to generate baby image: {result.error}")
            return None

        except Exception as e:
            logger.error(f"Error generating baby image: {e}")
            return None

    async def generate_aged_image(self, name: str, age_group: str, reference_description: str = "") -> Optional[str]:
        """
        Generate an age-progressed version of the baby.

        Args:
            name: Baby's name
            age_group: Target age group (baby, child, teen, adult)
            reference_description: Description of original baby's features for consistency

        Returns:
            Base64 encoded image string or None if generation failed
        """
        age_prompts = {
            "baby": "a cute baby (0-2 years old)",
            "child": "a young child (5-8 years old)",
            "teen": "a teenage person (14-16 years old)",
            "adult": "a young adult (20-25 years old)"
        }

        if age_group not in age_prompts:
            logger.error(f"Invalid age group: {age_group}")
            return None

        age_description = age_prompts[age_group]

        # Enhanced prompt for consistency
        consistency_note = ""
        if reference_description:
            consistency_note = f" Maintain consistent facial features from this description: {reference_description}."

        prompt = (
            f"Generate a photorealistic portrait of {age_description} named {name}. "
            f"High quality professional photography, clear facial features, natural lighting, "
            f"close-up portrait showing the face clearly.{consistency_note} "
            f"The person should look natural and realistic for their age."
        )

        try:
            result = await self.image_agent.execute(prompt, use_tools=True)

            if result.success and result.metadata.get("tools_used"):
                urls = re.findall(r'https?://[^\s\)]+', result.content)

                if urls and 'storage.googleapis.com' in urls[0]:
                    image_url = urls[0]
                    import requests
                    response = requests.get(image_url, timeout=30)
                    if response.status_code == 200:
                        base64_image = base64.b64encode(response.content).decode('utf-8')
                        return base64_image

            logger.error(f"Failed to generate aged image: {result.error}")
            return None

        except Exception as e:
            logger.error(f"Error generating aged image: {e}")
            return None

    def add_watermark(self, base64_image: str, name: str, age: str) -> str:
        """
        Add name and age watermark to the image.

        Args:
            base64_image: Base64 encoded image
            name: Baby's name
            age: Age label (e.g., "Baby", "Child", "Teen", "Adult")

        Returns:
            Base64 encoded watermarked image
        """
        try:
            # Decode base64 image
            image_data = base64.b64decode(base64_image)
            image = Image.open(io.BytesIO(image_data))

            # Ensure RGB mode
            if image.mode != 'RGB':
                image = image.convert('RGB')

            # Create drawing context
            draw = ImageDraw.Draw(image)

            # Calculate font size based on image dimensions
            width, height = image.size
            font_size = max(20, int(height * 0.04))

            # Try to use a nice font, fallback to default
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
            except Exception:
                font = ImageFont.load_default()

            # Prepare watermark text
            watermark_text = f"{name} - {age}"

            # Get text bounding box
            bbox = draw.textbbox((0, 0), watermark_text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]

            # Position at bottom center
            x = (width - text_width) // 2
            y = height - text_height - 20

            # Draw background rectangle
            padding = 10
            draw.rectangle(
                [x - padding, y - padding, x + text_width + padding, y + text_height + padding],
                fill=(0, 0, 0, 180)
            )

            # Draw text
            draw.text((x, y), watermark_text, fill=(255, 255, 255), font=font)

            # Convert back to base64
            output = io.BytesIO()
            image.save(output, format='JPEG', quality=95)
            output.seek(0)
            watermarked_base64 = base64.b64encode(output.read()).decode('utf-8')

            return watermarked_base64

        except Exception as e:
            logger.error(f"Error adding watermark: {e}")
            # Return original image if watermarking fails
            return base64_image