#![no_std]

// extern crate alloc;

use soroban_sdk::{contract, Env, String, contracttype, contractimpl};

#[contract]
pub struct ImageMetadataContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ImageMetadata {
    pub url: String,
    pub description: String,
    pub date: String,
    pub time: String,
    pub location: String,
    pub wallet_address: String,
    pub verification_status: bool,
}

#[contractimpl]
impl ImageMetadataContract {
    pub fn add_metadata(
        env: Env,
        url: String,
        addr: String, 
        description: String, 
        date: String, 
        time: String, 
        location: String,
        wallet_address: String,
        verification_status: bool
    ) -> bool {
        let metadata = ImageMetadata {
            url: url.clone(),
            description,
            date,
            time,
            location,
            wallet_address,
            verification_status,
        };
        // let key = Bytes::from_array(&env, &url.as_bytes());
        env.storage().persistent().set::<String, ImageMetadata>(&url, &metadata);
        true
    }

    pub fn get_metadata(env: Env, url: String) -> Option<ImageMetadata> {
        // let key = Bytes::from_array(&env, &url.as_bytes());
        env.storage().persistent().get::<String, ImageMetadata>(&url)
    }
}
