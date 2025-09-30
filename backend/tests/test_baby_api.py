"""Tests for baby name generator API endpoints."""

import os
import base64
from dotenv import load_dotenv
import requests

# Load environment
load_dotenv()

# API base URL
API_BASE = os.getenv("API_BASE_URL", "http://localhost:8001")
API_URL = f"{API_BASE}/api"


def test_baby_generation():
    """Test baby image generation."""
    print("\n=== Test 1: Generate Baby Image ===")

    response = requests.post(
        f"{API_URL}/baby/generate",
        json={"name": "Emma"},
        timeout=120
    )

    print(f"Status Code: {response.status_code}")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    data = response.json()
    print(f"Response: success={data.get('success')}, has_image={bool(data.get('image_data'))}")
    print(f"Image ID: {data.get('image_id')}")

    assert data["success"] is True, "Generation should succeed"
    assert data["image_data"] is not None, "Should return image data"
    assert data["image_id"] is not None, "Should return image ID"

    # Verify it's valid base64
    try:
        base64.b64decode(data["image_data"])
        print("✓ Valid base64 image data")
    except Exception as e:
        raise AssertionError(f"Invalid base64 data: {e}")

    return data["image_id"], data["name"] if "name" in data else "Emma"


def test_age_progression(image_id: str, name: str):
    """Test age progression."""
    print("\n=== Test 2: Age Progression ===")

    # Test only two age groups to reduce test time
    age_groups = ["baby", "child"]

    for age_group in age_groups:
        print(f"\nTesting age group: {age_group}")

        response = requests.post(
            f"{API_URL}/baby/age-progress",
            json={
                "image_id": image_id,
                "name": name,
                "age_group": age_group
            },
            timeout=120
        )

        print(f"Status Code: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"

        data = response.json()
        print(f"Response: success={data.get('success')}, age_group={data.get('age_group')}")

        assert data["success"] is True, f"Age progression for {age_group} should succeed"
        assert data["image_data"] is not None, f"Should return image data for {age_group}"
        assert data["age_group"] == age_group, f"Age group should match"

        # Verify it's valid base64
        try:
            base64.b64decode(data["image_data"])
            print(f"✓ Valid base64 image data for {age_group}")
        except Exception as e:
            raise AssertionError(f"Invalid base64 data for {age_group}: {e}")

        # Store one for watermark test
        if age_group == "child":
            test_image = data["image_data"]

    return test_image


def test_watermark(image_data: str, name: str):
    """Test watermark application."""
    print("\n=== Test 3: Watermark Application ===")

    response = requests.post(
        f"{API_URL}/baby/watermark",
        json={
            "image_data": image_data,
            "name": name,
            "age": "Child"
        },
        timeout=30
    )

    print(f"Status Code: {response.status_code}")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    data = response.json()
    print(f"Response: success={data.get('success')}, has_watermark={bool(data.get('watermarked_image'))}")

    assert data["success"] is True, "Watermark should succeed"
    assert data["watermarked_image"] is not None, "Should return watermarked image"

    # Verify it's valid base64
    try:
        watermarked_data = base64.b64decode(data["watermarked_image"])
        print(f"✓ Valid watermarked image ({len(watermarked_data)} bytes)")
    except Exception as e:
        raise AssertionError(f"Invalid watermarked image: {e}")


def main():
    """Run all tests."""
    print("=" * 60)
    print("Baby Name Generator API Tests")
    print("=" * 60)
    print(f"Testing API at: {API_URL}")

    try:
        # Test 1: Generate baby image
        image_id, name = test_baby_generation()

        # Test 2: Age progression
        test_image = test_age_progression(image_id, name)

        # Test 3: Watermark
        test_watermark(test_image, name)

        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED")
        print("=" * 60)

    except AssertionError as e:
        print("\n" + "=" * 60)
        print(f"✗ TEST FAILED: {e}")
        print("=" * 60)
        raise
    except Exception as e:
        print("\n" + "=" * 60)
        print(f"✗ ERROR: {e}")
        print("=" * 60)
        raise


if __name__ == "__main__":
    main()