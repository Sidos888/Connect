// BULLETPROOF Account Creation Function
// This replaces the complex handleCreateAccount function

const handleCreateAccount = async () => {
  // BULLETPROOF: Prevent multiple concurrent executions
  if (isCreating) {
    console.log('🛡️ BULLETPROOF: Account creation already in progress, ignoring duplicate click');
    return;
  }
  
  console.log('🚀 BULLETPROOF: Starting account creation process');
  setIsCreating(true);
  
  try {
    // Step 1: Validate prerequisites
    if (!user?.id) {
      throw new Error('No authenticated user found');
    }
    
    if (!formData.firstName || !formData.lastName) {
      throw new Error('Name is required');
    }
    
    console.log('🚀 BULLETPROOF: Prerequisites validated');
    
    // Step 2: Check for existing account (quick check)
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id, name, profile_pic')
      .eq('id', user.id)
      .maybeSingle();
    
    if (existingAccount) {
      console.log('🚀 BULLETPROOF: Found existing account, redirecting');
      setPersonalProfile({
        id: existingAccount.id,
        name: existingAccount.name,
        bio: '',
        avatarUrl: existingAccount.profile_pic || null,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: null,
        connectId: ''
      });
      setIsCreating(false);
      onClose();
      router.push('/my-life');
      return;
    }
    
    console.log('🚀 BULLETPROOF: No existing account, proceeding with creation');
    
    // Step 3: Create account directly in database (no complex auth context)
    console.log('🚀 BULLETPROOF: Creating account directly in database');
    
    const accountData = {
      id: user.id,  // Use auth user ID as account ID
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      bio: formData.bio || '',
      dob: formData.dateOfBirth || null,
      connect_id: generateConnectId(`${formData.firstName} ${formData.lastName}`.trim())
    };
    
    // Direct database insert with immediate response
    const { data: newAccount, error: insertError } = await supabase
      .from('accounts')
      .insert([accountData])
      .select('*')
      .single();
    
    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }
    
    console.log('🚀 BULLETPROOF: Account created in database:', newAccount);
    
    // Step 4: Create identity link
    const { error: identityError } = await supabase
      .from('account_identities')
      .insert({
        account_id: user.id,
        auth_user_id: user.id,
        method: 'email',
        identifier: formData.email
      });
    
    if (identityError) {
      console.log('🚀 BULLETPROOF: Identity link failed (continuing anyway):', identityError);
    } else {
      console.log('🚀 BULLETPROOF: Identity link created');
    }

    // Step 5: Upload avatar immediately (account definitely exists now)
    let avatarUrl = null;
    if (formData.profilePicture) {
      console.log('🚀 BULLETPROOF: Uploading avatar to storage');
      
      try {
        const fileExt = formData.profilePicture.name.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: storageError } = await supabase.storage
          .from('avatars')
          .upload(filePath, formData.profilePicture, { upsert: true });

        if (storageError) {
          throw new Error(`Storage upload failed: ${storageError.message}`);
        }

        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        avatarUrl = data.publicUrl;
        console.log('🚀 BULLETPROOF: Avatar uploaded to storage:', avatarUrl);
        
        // Update account with avatar URL immediately
        const { error: updateError } = await supabase
          .from('accounts')
          .update({ profile_pic: avatarUrl })
          .eq('id', user.id);
        
        if (updateError) {
          console.log('🚀 BULLETPROOF: Avatar URL update failed (continuing):', updateError);
        } else {
          console.log('🚀 BULLETPROOF: Avatar URL saved to database');
        }
        
      } catch (avatarError) {
        console.log('🚀 BULLETPROOF: Avatar upload failed (continuing without avatar):', avatarError);
      }
    }
    
    // Step 6: Create local profile and complete
    console.log('🚀 BULLETPROOF: Creating local profile');
    setPersonalProfile({
      id: user.id,
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      bio: formData.bio || '',
      avatarUrl: avatarUrl,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth || null,
      connectId: newAccount.connect_id
    });
    
    console.log('🚀 BULLETPROOF: Account creation completed successfully');
    setIsCreating(false);
    onClose();
    router.push('/my-life');
    
  } catch (error) {
    console.error('🚀 BULLETPROOF: Account creation failed:', error);
    setIsCreating(false);
    alert(`Account creation failed: ${error.message}`);
  }
};

